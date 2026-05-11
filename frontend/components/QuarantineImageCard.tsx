"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { approveQuarantinedImage, rejectQuarantinedImage } from "@/lib/actions/image-actions";
import { ShieldAlert, ShieldCheck, Trash2, Eye, EyeOff, AlertTriangle, Clock, ImageIcon } from "lucide-react";

interface StegoResult {
  verdict: "SUSPICIOUS" | "MALICIOUS" | "CLEAN" | "ERROR";
  stego_score: number;
  confidence: number;
  processing_time_ms?: number;
  details?: Record<string, unknown>;
  magic_type?: string;
  analyzed_at?: string;
}

interface QuarantineImageCardProps {
  image: {
    id: string;
    filename: string;
    minioPath: string;
    status: string;
    stegoResult: StegoResult | null;
    albumId: string;
    album: {
      title: string;
      user: {
        username: string;
        email: string;
      };
    };
  };
}

export function QuarantineImageCard({ image }: QuarantineImageCardProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const metricTooltips: Record<string, string> = {
    eof_score: "Proporcion de bytes extra al final del archivo. Rango 0-1.",
    lsb_score: "Irregularidad en los bits menos significativos (LSB). Rango 0-1.",
    timestamp: "Fecha/hora del analisis en UTC, formato ISO 8601.",
    confidence: "Confianza del veredicto basada en la distancia del puntaje a 0.5. Rango 0-1.",
    dimensions: "Dimensiones de la imagen en pixeles (ancho x alto).",
    pixel_count: "Total de pixeles de la imagen (ancho x alto).",
  };

  const stego = image.stegoResult;
  const verdict = stego?.verdict ?? "UNKNOWN";
  const score = stego?.stego_score ?? 0;
  const confidence = stego?.confidence ?? 0;

  const verdictColor =
    verdict === "MALICIOUS"
      ? "destructive"
      : verdict === "SUSPICIOUS"
      ? "secondary"
      : "default";

  const verdictLabel =
    verdict === "MALICIOUS"
      ? "Malicioso"
      : verdict === "SUSPICIOUS"
      ? "Sospechoso"
      : verdict;

  async function fetchImageUrl() {
    setLoadingUrl(true);
    try {
      const res = await fetch(
        `/api/quarantine/image-url?path=${encodeURIComponent(image.minioPath)}`
      );
      const data = await res.json();
      if (data.url) {
        setImageUrl(data.url);
        setShowImage(true);
      } else {
        setError("No se pudo obtener la URL de previsualización.");
      }
    } catch {
      setError("Error de conexión al obtener la imagen.");
    } finally {
      setLoadingUrl(false);
    }
  }

  function toggleImage() {
    if (showImage) {
      setShowImage(false);
    } else if (imageUrl) {
      setShowImage(true);
    } else {
      fetchImageUrl();
    }
  }

  async function handleApprove() {
    setPending(true);
    setError(null);
    const fd = new FormData();
    fd.append("imageId", image.id);
    const result = await approveQuarantinedImage(fd);
    if (result?.error) setError(result.error);
    setPending(false);
  }

  async function handleReject() {
    setPending(true);
    setError(null);
    const fd = new FormData();
    fd.append("imageId", image.id);
    const result = await rejectQuarantinedImage(fd);
    if (result?.error) setError(result.error);
    setPending(false);
  }

  // Format details for display
  const analysisDetails = stego?.details
    ? Object.entries(stego.details)
        .filter(([, v]) => v !== null && v !== undefined && v !== "")
        .slice(0, 6)
    : [];

  return (
    <Card className="flex flex-col overflow-hidden border-orange-200 dark:border-orange-900">
      {/* Header */}
      <CardHeader className="pb-3 bg-orange-50 dark:bg-orange-950/30">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate" title={image.filename}>
              {image.filename}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              Álbum: <span className="font-medium">{image.album.title}</span>
            </p>
            <p className="text-xs text-muted-foreground truncate">
              Usuario: {image.album.user.username} ({image.album.user.email})
            </p>
          </div>
          <Badge variant={verdictColor as "destructive" | "secondary" | "default"} className="shrink-0 flex gap-1 items-center">
            <AlertTriangle className="w-3 h-3" />
            {verdictLabel}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-3 pt-4">
        {/* Stego scores */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-md bg-muted px-3 py-2">
            <p className="text-xs text-muted-foreground">Puntuación Stego</p>
            <p className="font-bold text-orange-600 dark:text-orange-400">
              {(score * 100).toFixed(1)}%
            </p>
          </div>
          <div className="rounded-md bg-muted px-3 py-2">
            <p className="text-xs text-muted-foreground">Confianza</p>
            <p className="font-bold text-orange-600 dark:text-orange-400">
              {(confidence * 100).toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Analysis details */}
        {analysisDetails.length > 0 && (
          <div className="rounded-md border px-3 py-2 text-xs space-y-1">
            <p className="font-semibold text-muted-foreground mb-1 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" />
              Detalles del Análisis
            </p>
            {analysisDetails.map(([key, value]) => (
              <div key={key} className="flex justify-between gap-2">
                <span
                  className={`text-muted-foreground truncate ${metricTooltips[key] ? "cursor-help" : ""}`}
                  title={metricTooltips[key] ?? ""}
                >
                  {key}:
                </span>
                <span className="font-medium truncate text-right">
                  {typeof value === "number"
                    ? value.toFixed ? value.toFixed(4) : String(value)
                    : String(value)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Processing time */}
        {stego?.processing_time_ms && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Procesado en {stego.processing_time_ms} ms
          </p>
        )}

        {/* Image preview toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={toggleImage}
          disabled={loadingUrl}
          className="w-full flex gap-2"
        >
          {loadingUrl ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : showImage ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
          {showImage ? "Ocultar Imagen" : "Ver Imagen"}
        </Button>

        {/* Preview */}
        {showImage && imageUrl && (
          <div className="rounded-md overflow-hidden border bg-muted relative aspect-video flex items-center justify-center">
            <img
              src={imageUrl}
              alt={`Previsualización de ${image.filename}`}
              className="max-h-48 object-contain w-full"
              onError={() => {
                setError("La imagen no se pudo cargar. Puede que la URL haya expirado.");
                setShowImage(false);
              }}
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-xs text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded px-2 py-1">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-1">
          <form onSubmit={(e) => { e.preventDefault(); handleApprove(); }} className="flex-1">
            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white flex gap-2"
              disabled={pending}
              size="sm"
            >
              <ShieldCheck className="w-4 h-4" />
              Aprobar
            </Button>
          </form>
          <form onSubmit={(e) => { e.preventDefault(); handleReject(); }} className="flex-1">
            <Button
              type="submit"
              variant="destructive"
              className="w-full flex gap-2 bg-red-600 hover:bg-red-700 text-white"
              disabled={pending}
              size="sm"
            >
              <Trash2 className="w-4 h-4" />
              Rechazar
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
