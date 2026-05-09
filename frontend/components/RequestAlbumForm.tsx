"use client";

import { useRef, useState } from "react";
import { requestAlbum } from "@/lib/actions/album-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function RequestAlbumForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    const result = await requestAlbum(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    formRef.current?.reset();
  };

  if (success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-green-600">Solicitud Enviada</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Tu solicitud de álbum ha sido enviada y está pendiente de revisión por un supervisor.
          </p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => setSuccess(false)}
          >
            Crear Otro Álbum
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Solicitar Nuevo Álbum</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          ref={formRef}
          action={handleSubmit}
          className="space-y-4"
        >
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Título del Álbum *</Label>
            <Input
              id="title"
              name="title"
              type="text"
              required
              maxLength={255}
              placeholder="Mi Álbum de Fotos"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Input
              id="description"
              name="description"
              type="text"
              placeholder="Descripción del álbum..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="privacy">Privacidad</Label>
            <select
              id="privacy"
              name="privacy"
              className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              defaultValue="PRIVATE"
            >
              <option value="PRIVATE">Privado</option>
              <option value="PUBLIC">Público</option>
            </select>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Enviando..." : "Solicitar Álbum"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}