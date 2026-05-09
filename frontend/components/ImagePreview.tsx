"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageFile } from "@/types/image.types";

interface ImagePreviewProps {
    image: ImageFile;
    onRemove: () => void;
    isDragging?: boolean;
}

export function ImagePreview({ image, onRemove, isDragging }: ImagePreviewProps) {
    const StatusIndicator = () => {
        if (image.status === "uploading") {
            return (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            );
        }

        if (image.status === "error") {
            return (
                <div className="absolute inset-0 bg-destructive/20 flex items-center justify-center">
                    <span className="text-xs text-destructive font-medium">Error: {image.error}</span>
                </div>
            );
        }

        if (image.status === "success") {
            return (
                <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                    <span className="text-xs text-green-600 font-medium">OK</span>
                </div>
            );
        }

        return null;
    };

    return (
        <div className={cn(
            "relative group rounded-lg overflow-hidden border bg-muted/50",
            isDragging && "opacity-50 scale-105 z-50 shadow-lg"
        )}>
            <img src={image.preview} alt="" className="w-full h-24 object-cover" />
            <StatusIndicator />
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                className="absolute top-1 right-1 p-1 rounded-md bg-background/80 hover:bg-destructive hover:text-destructive-foreground transition-colors opacity-0 group-hover:opacity-100"
            >
                <X className="w-3 h-3" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                <p className="text-xs text-white truncate">{image.file.name}</p>
            </div>
        </div>
    );
}