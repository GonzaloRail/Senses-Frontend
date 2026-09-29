import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Camera, ImageUp, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type PatientPhotoFieldProps = {
  imageUrl?: string | null;
  disabled?: boolean;
  onChange: (file: File | null) => void;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const PatientPhotoField = ({
  imageUrl,
  disabled = false,
  onChange,
}: PatientPhotoFieldProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(imageUrl ?? null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    setPreviewUrl(imageUrl ?? null);
  }, [imageUrl]);

  useEffect(() => {
    if (!cameraOpen) {
      stopCamera();
      return;
    }

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        setCameraError("No fue posible acceder a la cámara. Verifica los permisos.");
      }
    };

    void startCamera();
    return stopCamera;
  }, [cameraOpen]);

  useEffect(() => stopCamera, []);

  const setFilePreview = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setCameraError("Selecciona un archivo de imagen válido.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setCameraError("La imagen no debe superar los 10 MB.");
      return;
    }

    setCameraError(null);
    setPreviewUrl(URL.createObjectURL(file));
    onChange(file);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      setFilePreview(new File([blob], "fotografia-paciente.jpg", { type: "image/jpeg" }));
      setCameraOpen(false);
    }, "image/jpeg", 0.9);
  };

  const removePhoto = () => {
    setPreviewUrl(null);
    onChange(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="h-28 w-28 shrink-0 overflow-hidden rounded-full border-4 border-white bg-slate-200 shadow-sm">
          {previewUrl ? (
            <img src={previewUrl} alt="Vista previa de la fotografía del paciente" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
              Sin foto
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <div>
            <p className="font-medium text-[#0B2035]">Fotografía del paciente</p>
            <p className="text-sm text-slate-500">Sube una imagen o tómala con la cámara web.</p>
          </div>
          {!disabled && (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                <ImageUp className="mr-2 h-4 w-4" /> Subir imagen
              </Button>
              <Button type="button" variant="outline" onClick={() => { setCameraError(null); setCameraOpen(true); }}>
                <Camera className="mr-2 h-4 w-4" /> Usar cámara
              </Button>
              {previewUrl && (
                <Button type="button" variant="ghost" className="text-destructive hover:text-destructive" onClick={removePhoto}>
                  <Trash2 className="mr-2 h-4 w-4" /> Quitar
                </Button>
              )}
            </div>
          )}
          {cameraError && <p className="text-sm text-destructive">{cameraError}</p>}
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) setFilePreview(file);
        }}
      />

      <Dialog open={cameraOpen} onOpenChange={setCameraOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Tomar fotografía</DialogTitle>
          </DialogHeader>
          {cameraError ? (
            <p className="text-sm text-destructive">{cameraError}</p>
          ) : (
            <video ref={videoRef} autoPlay playsInline className="aspect-video w-full rounded-lg bg-slate-900 object-cover" />
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setCameraOpen(false)}>Cancelar</Button>
            <Button type="button" onClick={capturePhoto} disabled={!!cameraError}>Capturar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
