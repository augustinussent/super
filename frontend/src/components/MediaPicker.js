import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Loader2, Image as ImageIcon, Check, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const MediaPicker = ({ onSelect, onClose, onUpload, multiple = false, resourceType = 'image' }) => {
    const { getToken } = useAuth();
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [nextCursor, setNextCursor] = useState(null);
    const [selectedItems, setSelectedItems] = useState([]);

    const fetchImages = async (cursor = null) => {
        try {
            setLoading(true);
            let url = `${API_URL}/api/media/gallery?resource_type=${resourceType}`;
            if (cursor) {
                url += `&next_cursor=${cursor}`;
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${getToken()}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch images');
            }

            const data = await response.json();

            if (cursor) {
                setImages(prev => [...prev, ...data.resources]);
            } else {
                setImages(data.resources);
            }

            setNextCursor(data.next_cursor);
        } catch (error) {
            console.error('Error fetching gallery:', error);
            toast.error('Gagal memuat galeri media');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setImages([]); // Reset images when resourceType changes
        setNextCursor(null);
        setSelectedItems([]);
        fetchImages();
    }, [resourceType]);

    const handleSelect = (image) => {
        if (multiple) {
            setSelectedItems(prev => {
                const exists = prev.find(i => i.public_id === image.public_id);
                if (exists) {
                    return prev.filter(i => i.public_id !== image.public_id);
                } else {
                    return [...prev, image];
                }
            });
        } else {
            setSelectedItems([image]);
        }
    };

    const isSelected = (image) => !!selectedItems.find(i => i.public_id === image.public_id);

    const handleConfirm = () => {
        if (selectedItems.length > 0) {
            const formattedItems = selectedItems.map(item => ({
                secure_url: item.secure_url,
                public_id: item.public_id,
                resource_type: item.resource_type
            }));

            if (multiple) {
                onSelect(formattedItems);
            } else {
                onSelect(formattedItems[0]);
            }
            onClose();
        }
    };

    return (
        <div className="flex flex-col h-[500px]">
            <div className="flex-1 min-h-0 relative">
                <ScrollArea className="h-full w-full rounded-md border p-4">
                    {images.length === 0 && !loading ? (
                        <div className="flex flex-col items-center justify-center h-48 text-gray-500">
                            <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                            <p>Belum ada media</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {images.map((image) => {
                                const selected = isSelected(image);
                                return (
                                    <div
                                        key={image.public_id}
                                        className={`relative aspect-square group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${selected ? 'border-emerald-500 ring-2 ring-emerald-500 ring-offset-2' : 'border-transparent hover:border-gray-300'
                                            }`}
                                        onClick={() => handleSelect(image)}
                                    >
                                        {resourceType === 'video' ? (
                                            <video
                                                src={image.secure_url}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <img
                                                src={image.secure_url.replace('/upload/', '/upload/w_300,h_300,c_fill/')}
                                                alt="Gallery item"
                                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                                loading="lazy"
                                            />
                                        )}

                                        {selected && (
                                            <div className="absolute top-2 right-2 bg-emerald-500 text-white p-1 rounded-full shadow-lg">
                                                <Check className="w-3 h-3" />
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {loading && (
                        <div className="flex justify-center py-4">
                            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                        </div>
                    )}

                    {!loading && nextCursor && (
                        <div className="flex justify-center py-4">
                            <Button variant="outline" onClick={() => fetchImages(nextCursor)}>
                                Muat Lebih Banyak
                            </Button>
                        </div>
                    )}
                </ScrollArea>
            </div>

            <div className="pt-4 flex justify-between items-center border-t mt-4">
                <Button variant="secondary" onClick={onUpload} className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Upload Baru
                </Button>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={onClose}>Batal</Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={selectedItems.length === 0}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        {multiple && selectedItems.length > 0 ? `Pilih ${selectedItems.length} Media` : 'Pilih Media'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default MediaPicker;
