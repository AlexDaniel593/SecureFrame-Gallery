"use client";

import { useState } from 'react';
import { ImageFile } from '@/types/image.types';

export function useImageUpload() {
    const [images, setImages] = useState<ImageFile[]>([]);

    const addImages = (files: File[]) => {
        const newImages: ImageFile[] = files.map(file => ({
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            file,
            preview: URL.createObjectURL(file),
            status: "pending",
        }));
        setImages(prev => [...prev, ...newImages]);
    };

    const removeImage = (id: string) => {
        const img = images.find(i => i.id === id);
        if (img) URL.revokeObjectURL(img.preview);
        setImages(prev => prev.filter(i => i.id !== id));
    };

    const reorderImages = (fromIndex: number, toIndex: number) => {
        setImages(prev => {
            const updated = [...prev];
            const [removed] = updated.splice(fromIndex, 1);
            updated.splice(toIndex, 0, removed);
            return updated;
        });
    };

    const updateImageStatus = (id: string, updates: Partial<ImageFile>) => {
        setImages(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    };

    const resetImages = () => {
        images.forEach(img => URL.revokeObjectURL(img.preview));
        setImages([]);
    };

    return {
        images,
        addImages,
        removeImage,
        reorderImages,
        updateImageStatus,
        resetImages,
    };
}