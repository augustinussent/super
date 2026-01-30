import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Upload, FileImage, FileVideo, Check, Copy, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const MediaConverter = () => {
    const { getToken } = useAuth();
    const [isUploading, setIsUploading] = useState(false);
    const [result, setResult] = useState(null);
    const [dragActive, setDragActive] = useState(false);

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
            handleUpload(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleUpload(e.target.files[0]);
        }
    };

    const handleUpload = async (file) => {
        setIsUploading(true);
        setResult(null);
        const formData = new FormData();
        formData.append('file', file);

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
            toast.success(data.message);
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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">Media Optimizer</h2>
                    <p className="text-gray-500">Convert images to WebP and optimize videos automatically.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upload Area */}
                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle>Upload Media</CardTitle>
                        <CardDescription>
                            Support: JPG, PNG (converted to WebP) | MP4, MOV (optimized)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
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

                            {isUploading ? (
                                <div className="flex flex-col items-center py-6">
                                    <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
                                    <p className="font-medium text-gray-900">Optimizing media...</p>
                                    <p className="text-sm text-gray-500">Please wait, this might take a moment.</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center py-6">
                                    <div className="w-16 h-16 bg-emerald-100/50 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                                        <Upload className="w-8 h-8" />
                                    </div>
                                    <p className="text-lg font-medium text-gray-900 mb-1">
                                        Click to upload or drag and drop
                                    </p>
                                    <p className="text-sm text-gray-500 mb-4">
                                        Images will be converted to WebP. Videos will be optimized.
                                    </p>
                                    <Button variant="outline" className="mt-2">Select File</Button>
                                </div>
                            )}
                        </div>
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
