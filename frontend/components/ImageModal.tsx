"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface ImageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  filename: string;
  createdAt?: string | Date;
}

export function ImageModal({ open, onOpenChange, imageUrl, filename, createdAt }: ImageModalProps) {
  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] p-0 gap-0 bg-black/95">
        <DialogTitle className="sr-only">{filename}</DialogTitle>
        <div className="relative flex items-center justify-center min-h-[50vh] max-h-[85vh]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={filename}
            className="max-w-full max-h-[85vh] object-contain"
          />
        </div>
        <div className="px-6 py-3 bg-background/80 backdrop-blur rounded-b-lg border-t">
          <p className="font-medium truncate">{filename}</p>
          {formattedDate && (
            <p className="text-xs text-muted-foreground">Subido el {formattedDate}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}