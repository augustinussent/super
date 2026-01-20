import { useState, useCallback, useRef } from 'react';
import { Upload, X, CheckCircle2, AlertCircle, Loader2, Image as ImageIcon, Video, Link as LinkIcon, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { toast } from 'sonner';

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
  cloudinaryResourceType = 'image'
}) => {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState('');
  const inputRef = useRef(null);

  const getToken = () => localStorage.getItem('token');

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

  // Open Cloudinary Media Library (allows browsing existing assets)
  const openCloudinaryWidget = () => {
    if (!window.cloudinary) {
      toast.error("Library Cloudinary gagal dimuat. Refresh halaman dan coba lagi.");
      return;
    }

    const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.REACT_APP_CLOUDINARY_API_KEY;

    // Debug logging
    console.log('Cloudinary Config:', { cloudName, apiKey: apiKey ? '***' : undefined });

    if (!cloudName) {
      toast.error("REACT_APP_CLOUDINARY_CLOUD_NAME belum dikonfigurasi.");
      return;
    }

    if (!apiKey) {
      toast.error("REACT_APP_CLOUDINARY_API_KEY belum dikonfigurasi di Vercel.");
      return;
    }

    // Use setTimeout to ensure the Media Library opens after the Dialog overlay loses focus
    setTimeout(() => {
      window.cloudinary.openMediaLibrary(
        {
          cloud_name: cloudName,
          api_key: apiKey,
          multiple: isMultiple,
          max_files: isMultiple ? maxFiles : 1,
          insert_caption: 'Pilih Media',
          remove_header: false,
          inline_container: null, // Open as modal, not inline
        },
        {
          insertHandler: (data) => {
            console.log('Media Library insertHandler called, data:', data);
            if (data.assets && data.assets.length > 0) {
              data.assets.forEach(asset => {
                const mediaData = {
                  secure_url: asset.secure_url,
                  public_id: asset.public_id,
                  resource_type: asset.resource_type
                };
                console.log('Media selected from Cloudinary:', mediaData);
                onUploadSuccess(mediaData);
              });
              toast.success(`${data.assets.length} media berhasil dipilih dari Cloudinary`);
            }
          }
        }
      );
    }, 100);
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
              uploadedMedia.push(response.data);
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

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* URL Input Section */}
        {showUrlInput && (
          <div className="flex gap-2">
            <Input
              placeholder="Paste URL media (gambar/video)..."
              value={urlInputValue}
              onChange={(e) => setUrlInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleUrlSubmit();
                }
              }}
              className="flex-1"
              data-testid="media-url-input"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={handleUrlSubmit}
              disabled={!urlInputValue.trim()}
              data-testid="media-url-submit"
            >
              <LinkIcon className="w-4 h-4 mr-2" />
              Link
            </Button>
          </div>
        )}

        {/* Cloudinary Browse Button */}
        {showCloudinaryBrowser && (
          <Button
            type="button"
            variant="outline"
            onClick={openCloudinaryWidget}
            className="w-full border-emerald-200 hover:bg-emerald-50 text-emerald-700"
            data-testid="cloudinary-browse-btn"
          >
            <Search className="w-4 h-4 mr-2" />
            Browse Cloudinary
          </Button>
        )}

        {/* Divider */}
        {(showUrlInput || showCloudinaryBrowser) && (
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">atau upload baru</span>
            </div>
          </div>
        )}

        {/* Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
            ${dragActive
              ? 'border-emerald-500 bg-emerald-50'
              : 'border-gray-300 hover:border-emerald-400 hover:bg-gray-50'
            }
          `}
          data-testid="media-dropzone"
        >
          <input
            ref={inputRef}
            type="file"
            multiple={isMultiple}
            accept={acceptedTypes.join(',')}
            onChange={handleChange}
            className="hidden"
            data-testid="media-input"
          />

          <div className="flex flex-col items-center gap-2">
            {isVideoType ? (
              <Video className="w-10 h-10 text-gray-400" />
            ) : (
              <ImageIcon className="w-10 h-10 text-gray-400" />
            )}
            <div>
              <p className="text-sm font-medium text-gray-700">
                {dragActive ? 'Drop files here' : 'Drag & drop atau klik untuk upload'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Max {maxFileSize / (1024 * 1024)}MB • {acceptedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')}
              </p>
            </div>
          </div>
        </div>

        {/* File Previews */}
        {files.length > 0 && (
          <div className="space-y-3">
            {files.map((fileData, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                {/* Preview */}
                {fileData.file.type.startsWith('image/') ? (
                  <img
                    src={fileData.preview}
                    alt="preview"
                    className="w-14 h-14 object-cover rounded"
                  />
                ) : (
                  <div className="w-14 h-14 bg-gray-200 rounded flex items-center justify-center">
                    <Video className="w-6 h-6 text-gray-500" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{fileData.file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(fileData.file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>

                  {/* Progress */}
                  {fileData.status === 'uploading' && (
                    <div className="mt-2">
                      <Progress value={fileData.progress} className="h-1" />
                      <p className="text-xs text-gray-500 mt-1">{fileData.progress}%</p>
                    </div>
                  )}

                  {/* Error */}
                  {fileData.status === 'error' && (
                    <p className="text-xs text-red-500 mt-1">{fileData.error}</p>
                  )}
                </div>

                {/* Status Icons */}
                <div className="flex-shrink-0">
                  {fileData.status === 'pending' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <X className="w-5 h-5 text-gray-400" />
                    </button>
                  )}
                  {fileData.status === 'uploading' && (
                    <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                  )}
                  {fileData.status === 'complete' && (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  )}
                  {fileData.status === 'error' && (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Button */}
        <Button
          onClick={uploadFiles}
          disabled={files.length === 0 || isUploading || files.every(f => f.status !== 'pending')}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          data-testid="upload-btn"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload {files.length > 0 ? `(${files.length})` : ''}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default MediaUpload;

