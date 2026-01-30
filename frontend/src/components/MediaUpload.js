import { useState, useCallback, useRef } from 'react';
import { Upload, X, CheckCircle2, AlertCircle, Loader2, Image as ImageIcon, Video, Link as LinkIcon, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import MediaPicker from './MediaPicker';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export const MediaUpload = ({
  onUploadSuccess,
  uploadEndpoint,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  maxFileSize = 10 * 1024 * 1024,
  maxFiles = 1,
  isMultiple = false,
  title = 'Upload Media',
  description = 'Drag and drop files or click to select',
  showCloudinaryBrowser = true,
  showUrlInput = true,
  cloudinaryResourceType = 'image',
  onCloseDialog = null
}) => {
  const { getToken } = useAuth(); // Ensure useAuth is imported or passed. Wait, previous snippet didn't show useAuth import. 
  // Inspecting MediaUpload.js first to see if useAuth is imported.
  // It is NOT in the previous snippet. But `getToken` was used in `openCloudinaryWidget` in my previous edits.
  // I need to check if `useAuth` is imported. It probably isn't.
  // I added usages of `getToken()` in `openCloudinaryWidget` in previous turns.
  // If `useAuth` is not imported, I must import it.

  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState('');
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const inputRef = useRef(null);



  const validateFile = (file) => {
    if (!acceptedTypes.includes(file.type)) {
      return { valid: false, error: `File type ${file.type} not allowed` };
    }
    if (file.size > maxFileSize) {
      return { valid: false, error: `File size exceeds ${maxFileSize / (1024 * 1024)}MB limit` };
    }
    return { valid: true };
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const processFiles = useCallback((selectedFiles) => {
    const validFiles = [];

    for (const file of selectedFiles) {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push({
          file,
          preview: URL.createObjectURL(file),
          progress: 0,
          status: 'pending',
          error: null
        });
      } else {
        toast.error(validation.error);
      }
    }

    if (!isMultiple) {
      setFiles(validFiles.slice(0, 1));
    } else {
      setFiles(prev => [...prev, ...validFiles].slice(0, maxFiles));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acceptedTypes, maxFileSize, isMultiple, maxFiles]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  }, [processFiles]);

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index) => {
    setFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  // Handle URL input submission
  const handleUrlSubmit = () => {
    if (!urlInputValue.trim()) {
      toast.error('Masukkan URL yang valid');
      return;
    }

    if (!urlInputValue.startsWith('http://') && !urlInputValue.startsWith('https://')) {
      toast.error('URL harus dimulai dengan http:// atau https://');
      return;
    }

    // Create a synthetic media data object
    const mediaData = {
      secure_url: urlInputValue.trim(),
      public_id: `url-${Date.now()}`,
      resource_type: cloudinaryResourceType
    };

    onUploadSuccess(mediaData);
    setUrlInputValue('');
    toast.success('Media dari URL berhasil ditambahkan');
  };

  // Open Cloudinary Upload Widget (works without login)

  // Open Cloudinary Upload Widget (with signed access for Media Library)
  const openCloudinaryWidget = async (defaultSource = 'local') => {
    if (!window.cloudinary) {
      toast.error("Library Cloudinary gagal dimuat. Refresh halaman dan coba lagi.");
      return;
    }

    try {
      // 1. Get Cloudinary Config (API Key, Cloud Name) from Backend
      // We need this because API Key might not be exposed in frontend env
      const configResponse = await fetch(`${API_URL}/media/config`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });

      if (!configResponse.ok) {
        throw new Error('Failed to load Cloudinary configuration');
      }

      const config = await configResponse.json();

      // Close parent dialog first to avoid z-index conflicts
      if (onCloseDialog) {
        onCloseDialog();
      }

      // 2. Define signature generation function
      const generateSignature = async (callback, params_to_sign) => {
        try {
          console.log("Cloudinary Widget requesting signature for params:", params_to_sign);

          const response = await fetch(`${API_URL}/media/signature`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify(params_to_sign)
          });

          if (!response.ok) {
            throw new Error('Failed to generate signature');
          }

          const data = await response.json();
          console.log("Signature generated:", data);

          // Widget expects the signature string
          callback(data.signature);
        } catch (error) {
          console.error('Signature generation error:', error);
          toast.error("Gagal membuat signature: " + error.message);
        }
      };

      // 3. Open Widget
      setTimeout(() => {
        const widgetConfig = {
          cloudName: config.cloud_name,
          apiKey: config.api_key,
          uploadSignature: generateSignature,
          sources: ['local', 'url', 'camera', 'cloudinary'],
          defaultSource: defaultSource,
          multiple: isMultiple,
          maxFiles: isMultiple ? maxFiles : 1,
          resourceType: cloudinaryResourceType === 'video' ? 'video' : 'image',
          clientAllowedFormats: cloudinaryResourceType === 'video'
            ? ['mp4', 'webm', 'mov']
            : ['jpg', 'jpeg', 'png', 'webp', 'gif'],
          showAdvancedOptions: true,
          showCompletedButton: true,
          singleUploadAutoClose: !isMultiple,
          styles: {
            palette: {
              window: "#FFFFFF",
              windowBorder: "#90A0B3",
              tabIcon: "#059669",
              menuIcons: "#5A616A",
              textDark: "#000000",
              textLight: "#FFFFFF",
              link: "#059669",
              action: "#059669",
              inactiveTabIcon: "#6B7280",
              error: "#F44235",
              inProgress: "#059669",
              complete: "#10B981",
              sourceBg: "#F9FAFB"
            }
          }
        };

        const widget = window.cloudinary.createUploadWidget(
          widgetConfig,
          (error, result) => {
            if (error) {
              console.error('Cloudinary error:', error);
              if (error.message !== 'User closed widget') {
                toast.error("Upload/Select error: " + (error.message || error.statusText || 'Unknown error'));
              }
              return;
            }

            if (result.event === 'success') {
              const mediaData = {
                secure_url: result.info.secure_url,
                public_id: result.info.public_id,
                resource_type: result.info.resource_type
              };
              console.log('Cloudinary success, mediaData:', mediaData);
              onUploadSuccess(mediaData);
              toast.success('Media berhasil dipilih/diupload');
            }
          }
        );

        widget.open();
      }, 500);

    } catch (error) {
      console.error('Error opening Cloudinary widget:', error);
      toast.error("Gagal membuka widget Cloudinary: " + error.message);
    }
  };

  // Open Cloudinary Media Library directly (using the widget)
  const openCloudinaryDashboard = () => {
    setShowMediaPicker(true);
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    const uploadedMedia = [];

    for (let i = 0; i < files.length; i++) {
      const fileData = files[i];
      const formData = new FormData();
      formData.append('file', fileData.file);

      // Update status to uploading
      setFiles(prev => prev.map((f, idx) =>
        idx === i ? { ...f, status: 'uploading' } : f
      ));

      try {
        const xhr = new XMLHttpRequest();

        await new Promise((resolve, reject) => {
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const percent = Math.round((e.loaded / e.total) * 100);
              setFiles(prev => prev.map((f, idx) =>
                idx === i ? { ...f, progress: percent } : f
              ));
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const response = JSON.parse(xhr.responseText);
              setFiles(prev => prev.map((f, idx) =>
                idx === i ? { ...f, status: 'complete', progress: 100 } : f
              ));

              // Include AI caption in response if available
              const mediaData = response.data;
              if (response.ai_caption && response.ai_caption.success) {
                mediaData.ai_caption = response.ai_caption.caption;
                mediaData.ai_alt_text = response.ai_caption.alt_text;
                toast.success(`✨ AI Caption: "${response.ai_caption.caption}"`);
              }

              uploadedMedia.push(mediaData);
              resolve(response);
            } else {
              const error = xhr.responseText ? JSON.parse(xhr.responseText).detail : 'Upload failed';
              setFiles(prev => prev.map((f, idx) =>
                idx === i ? { ...f, status: 'error', error } : f
              ));
              reject(new Error(error));
            }
          });

          xhr.addEventListener('error', () => {
            setFiles(prev => prev.map((f, idx) =>
              idx === i ? { ...f, status: 'error', error: 'Network error' } : f
            ));
            reject(new Error('Network error'));
          });

          xhr.open('POST', `${API_URL}${uploadEndpoint}`);
          xhr.setRequestHeader('Authorization', `Bearer ${getToken()}`);
          xhr.send(formData);
        });
      } catch (err) {
        console.error('Upload error:', err);
      }
    }

    setIsUploading(false);

    if (uploadedMedia.length > 0) {
      onUploadSuccess(isMultiple ? uploadedMedia : uploadedMedia[0]);
      toast.success(`${uploadedMedia.length} file(s) uploaded successfully`);

      // Clear files after success
      setTimeout(() => {
        setFiles([]);
      }, 2000);
    }
  };

  const isVideoType = acceptedTypes.some(t => t.startsWith('video/'));

  // Open Cloudinary Widget for uploading (triggered by MediaPicker)
  const handleUploadRequest = () => {
    openCloudinaryWidget('local'); // Open widget with local source default
  };

  return (
    <Card className="w-full border-0 shadow-none">
      <CardContent className="p-0">
        <MediaPicker
          onSelect={(media) => {
            onUploadSuccess(media);
            toast.success("Media dipilih");
            if (onCloseDialog) onCloseDialog();
          }}
          onClose={() => {
            if (onCloseDialog) onCloseDialog();
          }}
          onUpload={handleUploadRequest}
        />
      </CardContent>
    </Card>
  );
};

export default MediaUpload;

