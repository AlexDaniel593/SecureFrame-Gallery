"use client";

import { DndContext, DragOverlay } from "@dnd-kit/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { ImageDropZone } from "./ImageDropZone";
import { DraggableImage } from "./DraggableImage";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useImageUploader } from "@/hooks/useImageUploader";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import {UploadSuccessCard} from "@/components/UploadSuccessCard";

interface UploadImageFormProps {
    albumId: string;
    onUploadComplete?: () => void;
}

export function UploadImageForm({ albumId, onUploadComplete }: UploadImageFormProps) {
    const { images, addImages, removeImage, reorderImages, resetImages, updateImageStatus } = useImageUpload();
    const { uploadAll, uploading } = useImageUploader(albumId, onUploadComplete);
    const { activeImage, handleDragStart, handleDragEnd } = useDragAndDrop(images, reorderImages);

    const handleUploadAll = () => uploadAll(images, updateImageStatus);

    const hasErrors = images.some(i => i.status === "error");
    const allSuccess = images.length > 0 && images.every(i => i.status === "success");
    const hasPending = images.some(i => i.status === "pending" || i.status === "error");

    if (allSuccess) {
        return <UploadSuccessCard onReset={resetImages} />;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Subir Imágenes para Análisis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                    <ImageDropZone onFileSelect={addImages}>
                        {images.length > 0 && (
                            <div className="mt-4 w-full max-w-md grid grid-cols-3 sm:grid-cols-4 gap-2 px-4">
                                {images.map(image => (
                                    <DraggableImage
                                        key={image.id}
                                        image={image}
                                        onRemove={() => removeImage(image.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </ImageDropZone>
                    <DragOverlay>
                        {activeImage && (
                            <div className="w-32 h-32 rounded-lg overflow-hidden border-2 border-primary shadow-xl opacity-90">
                                <img src={activeImage.preview} alt="" className="w-full h-full object-cover" />
                            </div>
                        )}
                    </DragOverlay>
                </DndContext>

                {hasErrors && (
                    <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                        Algunas imágenes fallaron. Revisa los errores y reintenta.
                    </div>
                )}

                {images.length > 0 && (
                    <div className="flex gap-2">
                        <Button onClick={handleUploadAll} disabled={uploading || !hasPending} className="flex-1">
                            {uploading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Analizando...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4 mr-2" />
                                    Analizar {images.filter(i => i.status === "pending" || i.status === "error").length} Imagenes
                                </>
                            )}
                        </Button>
                        <Button variant="outline" onClick={resetImages}>Limpiar</Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}