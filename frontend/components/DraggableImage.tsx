"use client";

import { useDraggable } from "@dnd-kit/core";
import { ImagePreview } from "./ImagePreview";
import { ImageFile } from "@/types/image.types";

interface DraggableImageProps {
    image: ImageFile;
    onRemove: () => void;
}

export function DraggableImage({ image, onRemove }: DraggableImageProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: image.id,
        data: { image },
    });

    const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className="cursor-grab active:cursor-grabbing"
        >
            <ImagePreview image={image} onRemove={onRemove} isDragging={isDragging} />
        </div>
    );
}