"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type AlbumStatus = "PENDING" | "APPROVED" | "REJECTED";
type AlbumPrivacy = "PUBLIC" | "PRIVATE";

interface Album {
  id: string;
  title: string;
  description: string | null;
  privacy: AlbumPrivacy;
  status: AlbumStatus;
  createdAt: Date;
  user: {
    username: string;
  };
}

interface AlbumsListProps {
  initialAlbums: Album[];
}

type FilterType = "ALL" | "APPROVED" | "PENDING" | "REJECTED";

const statusLabels: Record<AlbumStatus, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
};

const statusColors: Record<AlbumStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  APPROVED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const privacyLabels: Record<AlbumPrivacy, string> = {
  PUBLIC: "Público",
  PRIVATE: "Privado",
};

export function AlbumsList({ initialAlbums }: AlbumsListProps) {
  const [filter, setFilter] = useState<FilterType>("ALL");

  const filteredAlbums = initialAlbums.filter((album) => {
    if (filter === "ALL") return true;
    return album.status === filter;
  });

  const filters: { value: FilterType; label: string }[] = [
    { value: "ALL", label: "Todos" },
    { value: "APPROVED", label: "Aprobados" },
    { value: "PENDING", label: "Pendientes" },
    { value: "REJECTED", label: "Rechazados" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filteredAlbums.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {filter === "ALL"
              ? "No tienes álbumes todavía. Crea uno desde el Dashboard."
              : `No hay álbumes ${filters.find((f) => f.value === filter)?.label.toLowerCase()}.`}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAlbums.map((album) => (
            <Card key={album.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold">
                  {album.title}
                </CardTitle>
                <Badge className={statusColors[album.status]}>
                  {statusLabels[album.status]}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  {album.description || "Sin descripción"}
                </p>
                <div className="mb-3">
                  <Link href={`/dashboard/albums/${album.id}/upload`}>
                    <Button size="sm">Subir imagenes</Button>
                  </Link>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{privacyLabels[album.privacy]}</span>
                  <span>
                    {new Date(album.createdAt).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}