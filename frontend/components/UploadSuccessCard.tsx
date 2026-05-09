// components/UploadSuccessCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileImage } from "lucide-react";

interface UploadSuccessCardProps {
    onReset: () => void;
}

export function UploadSuccessCard({ onReset }: UploadSuccessCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-green-600 flex items-center gap-2">
                    <FileImage className="w-5 h-5" /> Análisis Completado
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-4">
                    Todas las imágenes han sido analizadas exitosamente.
                </p>
                <Button variant="outline" onClick={onReset}>Subir Más Imágenes</Button>
            </CardContent>
        </Card>
    );
}