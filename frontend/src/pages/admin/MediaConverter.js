import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Upload, FileImage, FileVideo, Check, Copy, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const MediaConverter = ({ onSuccess, onCancel, embedded = false }) => {
    const { getToken } = useAuth();
    const [isUploading, setIsUploading] = useState(false);
    const [result, setResult] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [seoFilename, setSeoFilename] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            selectFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            selectFile(e.target.files[0]);
        }
    };

    const selectFile = (file) => {
        setSelectedFile(file);
        // Default SEO filename from original file (remove extension)
        const nameWithoutExt = file.name.split('.').slice(0, -1).join('.');
        setSeoFilename(nameWithoutExt.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase());
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setIsUploading(true);
        setResult(null);
        const formData = new FormData();
        formData.append('file', selectedFile);
        if (seoFilename) {
            formData.append('filename', seoFilename);
        }

        try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/media/convert`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${getToken()}`
                },
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Conversion failed');
            }

            const data = await response.json();
            setResult(data);

            // If callback provided, call it with result
            if (onSuccess) {
                // Construct standard media object
                const mediaObj = {
                    secure_url: data.url,
                    public_id: data.public_id,
                    resource_type: data.format === 'mp4' || data.format === 'webm' ? 'video' : 'image'
                };
                onSuccess(mediaObj);
            } else {
                toast.success(data.message);
            }
        } catch (error) {
            console.error('Conversion error:', error);
            toast.error(error.message);
        } finally {
            setIsUploading(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success('Link copied to clipboard');
    };

    return (
        <div className={embedded ? "" : "space-y-6"}>
            {!embedded && (
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Media Optimizer</h2>
                        <p className="text-gray-500">Convert images to WebP and optimize videos automatically.</p>
                    </div>
                </div>
            )}

            <div className={`grid grid-cols-1 ${embedded ? 'gap-4' : 'lg:grid-cols-2 gap-6'}`}>
                {/* Upload Area */}
                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle>Upload & Optimize</CardTitle>
                        <CardDescription>
                            Auto-convert to WebP. Rename for SEO before upload.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!selectedFile ? (
                            <div
                                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${dragActive ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 hover:border-emerald-400 hover:bg-gray-50'
                                    }`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                onClick={() => document.getElementById('converter-upload').click()}
                            >
                                <input
                                    id="converter-upload"
                                    type="file"
                                    className="hidden"
                                    onChange={handleChange}
                                    accept="image/*,video/*"
                                />
                                <div className="flex flex-col items-center py-6">
                                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                    <p className="font-medium text-gray-900">Click to upload</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                                    <FileImage className="w-8 h-8 text-emerald-600" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{selectedFile.name}</p>
                                        <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)}>
                                        Change
                                    </Button>
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-gray-700 mb-1 block">SEO Filename (Optional)</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={seoFilename}
                                            onChange={(e) => setSeoFilename(e.target.value)}
                                            className="flex-1 px-3 py-2 border rounded-md text-sm"
                                            placeholder="e.g. duluxe-room-balcony"
                                        />
                                        <span className="text-gray-400 text-sm">.webp</span>
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-1">Use keywords separated by dashes.</p>
                                </div>

                                <div className="flex gap-2 justify-end pt-2">
                                    {onCancel && (
                                        <Button variant="outline" onClick={onCancel} disabled={isUploading}>Cancel</Button>
                                    )}
                                    <Button onClick={handleUpload} disabled={isUploading} className="bg-emerald-600">
                                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                                        Optimize & Upload
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Result Area */}
                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle>Optimization Result</CardTitle>
                        <CardDescription>
                            Copy the URL below to use in your content.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!result ? (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-400 bg-gray-50 rounded-xl border border-dashed">
                                <ArrowRight className="w-12 h-12 mb-2 opacity-20" />
                                <p>Result will appear here</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex items-start gap-4 p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                                    <div className="p-2 bg-white rounded-md shadow-sm">
                                        {result.format === 'mp4' || result.format === 'webm' || result.format === 'mov' ? (
                                            <FileVideo className="w-8 h-8 text-emerald-600" />
                                        ) : (
                                            <FileImage className="w-8 h-8 text-emerald-600" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-gray-900 truncate">{result.original_name}</h4>
                                        <div className="flex gap-2 mt-1 text-xs text-gray-500">
                                            <span className="bg-white px-1.5 py-0.5 rounded border uppercase">{result.format}</span>
                                            <span className="bg-white px-1.5 py-0.5 rounded border">{Math.round(result.size / 1024)} KB</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-center w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full">
                                        <Check className="w-5 h-5" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Optimized URL</label>
                                    <div className="flex gap-2">
                                        <code className="flex-1 bg-gray-100 p-2.5 rounded text-sm text-gray-800 break-all font-mono border">
                                            {result.url}
                                        </code>
                                        <Button onClick={() => copyToClipboard(result.url)} className="shrink-0">
                                            <Copy className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Preview */}
                                <div className="border rounded-lg overflow-hidden bg-gray-900">
                                    {result.format === 'mp4' || result.format === 'webm' || result.format === 'mov' ? (
                                        <video src={result.url} controls className="w-full h-auto max-h-[300px]" />
                                    ) : (
                                        <img src={result.url} alt="Preview" className="w-full h-auto max-h-[300px] object-contain" />
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default MediaConverter;
