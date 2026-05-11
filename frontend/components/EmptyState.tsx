import { ImageIcon } from "lucide-react";

interface EmptyStateProps {
  message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
      <ImageIcon className="w-16 h-16 mb-4 opacity-40" />
      <p className="text-lg font-medium">{message}</p>
    </div>
  );
}
