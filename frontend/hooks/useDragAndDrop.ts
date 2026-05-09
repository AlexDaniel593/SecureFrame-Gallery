"use client";

import { useState } from 'react';
import { DragStartEvent, DragEndEvent, Active, Over } from '@dnd-kit/core';
import { ImageFile } from '@/types/image.types';

export function useDragAndDrop(images: ImageFile[], onReorder: (from: number, to: number) => void) {
    const [activeImage, setActiveImage] = useState<ImageFile | null>(null);

    const handleDragStart = (event: DragStartEvent) => {
        const img = images.find(i => i.id === event.active.id);
        if (img) setActiveImage(img);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveImage(null);

        const { active, over } = event;

        if (!isValidDrop(active, over)) return;

        const fromIdx = images.findIndex(i => i.id === active.id);
        const toIdx = images.findIndex(i => i.id === over.id);

        if (isValidReorder(fromIdx, toIdx)) {
            onReorder(fromIdx, toIdx);
        }
    };

    const isValidDrop = (active: Active, over: Over | null): over is Over => {
        return over !== null && active.id !== over.id;
    };

    const isValidReorder = (fromIdx: number, toIdx: number): boolean => {
        return fromIdx !== -1 && toIdx !== -1;
    };

    return { activeImage, handleDragStart, handleDragEnd };
}