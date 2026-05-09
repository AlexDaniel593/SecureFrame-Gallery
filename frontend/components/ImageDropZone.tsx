"use client";

import { useCallback, useRef } from "react";
import { useDroppable } from "@dnd-kit/core";
import { ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ALLOWED_TYPES, isValidFileType, MAX_FILE_SIZE } from "@/constants/file-types";

interface ImageDropZoneProps {
    onFileSelect: (files: File[]) => void;
    children?: React.ReactNode;
}

export function ImageDropZone({ onFileSelect, children }: ImageDropZoneProps) {
    const { setNodeRef, isOver } = useDroppable({ id: "drop-zone" });
    const inputRef = useRef<HTMLInputElement>(null);

    const filterValidFiles = (files: File[]): File[] => {
        return files.filter(file => {
            const isValid = isValidFileType(file) && file.size <= MAX_FILE_SIZE;
            if (!isValid) {
                console.warn(`Archivo inválido: ${file.name} (${file.type}, ${file.size} bytes)`);
            }
            return isValid;
        });
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        const validFiles = filterValidFiles(files);
        if (validFiles.length) onFileSelect(validFiles);
    }, [onFileSelect]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const validFiles = filterValidFiles(files);
        if (validFiles.length) onFileSelect(validFiles);
        e.target.value = "";
    };

    return (
        <div
            ref={setNodeRef}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className={cn(
                "relative flex flex-col items-center justify-center min-h-64 border-2 border-dashed rounded-xl transition-colors cursor-pointer",
                isOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
            )}
            onClick={() => inputRef.current?.click()}
        >
            <input
                ref={inputRef}
                type="file"
                accept={ALLOWED_TYPES.join(",")}
                multiple
                className="hidden"
                onChange={handleChange}
            />
            <ImagePlus className={cn("w-10 h-10 mb-3 transition-colors", isOver ? "text-primary" : "text-muted-foreground")} />
            <p className="text-sm font-medium text-center px-4">
                Arrastra imágenes aquí o <span className="text-primary underline">haz clic para seleccionar</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
                {ALLOWED_TYPES.map(t => t.split("/")[1].toUpperCase()).join(", ")} • Máx {MAX_FILE_SIZE / 1024 / 1024}MB
            </p>
            {children}
        </div>
    );
}