import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Image, Calendar } from "lucide-react";

interface GalleryCardProps {
  album: {
    id: string;
    title: string;
    description?: string | null;
    cleanImageCount: number;
    createdAt?: string | Date;
  };
}

export function GalleryCard({ album }: GalleryCardProps) {
  const formattedDate = album.createdAt
    ? new Date(album.createdAt).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <Link href={`/gallery/${album.id}`} className="block group">
      <Card className="h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-border/60">
        {/* Cover placeholder with gradient */}
        <div className="h-40 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 dark:from-blue-600/30 dark:via-purple-600/30 dark:to-pink-600/30 flex items-center justify-center group-hover:from-blue-500/30 group-hover:via-purple-500/30 group-hover:to-pink-500/30 transition-colors">
          <Image className="w-12 h-12 text-muted-foreground/50" />
        </div>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg line-clamp-1 group-hover:text-primary transition-colors">
            {album.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {album.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {album.description}
            </p>
          )}
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="gap-1">
              <Image className="w-3 h-3" />
              {album.cleanImageCount}{" "}
              {album.cleanImageCount === 1 ? "imagen" : "imágenes"}
            </Badge>
            {formattedDate && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formattedDate}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
