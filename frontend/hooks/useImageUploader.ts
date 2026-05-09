"use client";

import { useState } from 'react';
import { ImageFile } from '@/types/image.types';

export function useImageUploader(albumId: string, onSuccess?: () => void) {
    const [uploading, setUploading] = useState(false);

    const uploadSingle = async (image: ImageFile): Promise<ImageFile> => {
        const formData = new FormData();
        formData.append("file", image.file);
        formData.append("albumId", albumId);

        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();

        if (res.ok) {
            return { ...image, status: "success", result: data };
        } else {
            return { ...image, status: "error", error: data.error };
        }
    };

    const uploadAll = async (images: ImageFile[], onStatusUpdate: (id: string, updates: Partial<ImageFile>) => void) => {
        setUploading(true);
        const pending = images.filter(i => i.status === "pending" || i.status === "error");

        for (const img of pending) {
            onStatusUpdate(img.id, { status: "uploading" });
            try {
                const updated = await uploadSingle(img);
                onStatusUpdate(img.id, updated);
            } catch {
                onStatusUpdate(img.id, { status: "error", error: "Error de conexión" });
            }
        }

        setUploading(false);
        onSuccess?.();
    };

    return { uploadAll, uploading };
}