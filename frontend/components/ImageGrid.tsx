"use client";

import { useState } from "react";
import { ImageModal } from "@/components/ImageModal";

interface ImageItem {
  id: string;
  filename: string;
  url: string;
}

interface ImageGridProps {
  images: ImageItem[];
}

export function ImageGrid({ images }: ImageGridProps) {
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {images.map((image) => (
          <button
            key={image.id}
            onClick={() => setSelectedImage(image)}
            className="group relative aspect-[4/3] rounded-lg overflow-hidden border bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.url}
              alt={image.filename}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end p-2">
              <p className="text-white text-xs truncate w-full opacity-0 group-hover:opacity-100 transition-opacity">
                {image.filename}
              </p>
            </div>
          </button>
        ))}
      </div>

      {selectedImage && (
        <ImageModal
          open={!!selectedImage}
          onOpenChange={(open) => {
            if (!open) setSelectedImage(null);
          }}
          imageUrl={selectedImage.url}
          filename={selectedImage.filename}
        />
      )}
    </>
  );
}
