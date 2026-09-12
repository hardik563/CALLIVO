import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ZoomIn, ZoomOut, RotateCw, RefreshCw, Upload, Check, AlertCircle } from 'lucide-react';

interface AvatarCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageFile?: File | null;
  initialImageUrl?: string | null;
  onSave: (croppedDataUrl: string) => Promise<void> | void;
  maxSizeBytes?: number; // default 5MB
}

export const AvatarCropModal: React.FC<AvatarCropModalProps> = ({
  isOpen,
  onClose,
  imageFile,
  initialImageUrl,
  onSave,
  maxSizeBytes = 5 * 1024 * 1024, // 5MB
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Transform states
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // in degrees: 0, 90, 180, 270
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageObjRef = useRef<HTMLImageElement | null>(null);

  // Load image from prop or file
  useEffect(() => {
    setErrorMessage(null);
    if (imageFile) {
      if (imageFile.size > maxSizeBytes) {
        setErrorMessage(`Selected image exceeds maximum allowed size of ${(maxSizeBytes / (1024 * 1024)).toFixed(0)}MB.`);
        setImageSrc(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
        resetTransforms();
      };
      reader.readAsDataURL(imageFile);
    } else if (initialImageUrl) {
      setImageSrc(initialImageUrl);
      resetTransforms();
    } else {
      setImageSrc(null);
    }
  }, [imageFile, initialImageUrl, maxSizeBytes]);

  const resetTransforms = () => {
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSizeBytes) {
      setErrorMessage(`File is ${(file.size / (1024 * 1024)).toFixed(2)}MB. Maximum allowed is ${(maxSizeBytes / (1024 * 1024)).toFixed(0)}MB.`);
      return;
    }

    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      resetTransforms();
    };
    reader.readAsDataURL(file);
  };

  // Draw crop preview on canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageSrc) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageObjRef.current;
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const size = canvas.width; // 320x320
    ctx.clearRect(0, 0, size, size);

    ctx.save();
    // Center point
    ctx.translate(size / 2 + offset.x, size / 2 + offset.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);

    // Draw image centered
    const baseScale = Math.max(size / img.naturalWidth, size / img.naturalHeight);
    const drawWidth = img.naturalWidth * baseScale;
    const drawHeight = img.naturalHeight * baseScale;
    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

    ctx.restore();
  }, [imageSrc, zoom, rotation, offset]);

  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageObjRef.current = img;
      drawCanvas();
    };
    img.src = imageSrc;
  }, [imageSrc, drawCanvas]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Mouse / Touch handlers for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - offset.x,
        y: e.touches[0].clientY - offset.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setOffset({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleExportAndSave = async () => {
    const img = imageObjRef.current;
    if (!img) return;

    try {
      setIsSaving(true);
      // High-res output canvas (400x400)
      const exportCanvas = document.createElement('canvas');
      const exportSize = 400;
      exportCanvas.width = exportSize;
      exportCanvas.height = exportSize;
      const ctx = exportCanvas.getContext('2d');
      if (!ctx) return;

      // 1:1 Circular clip mask
      ctx.beginPath();
      ctx.arc(exportSize / 2, exportSize / 2, exportSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // Ratio between preview canvas (320px) and export canvas (400px)
      const ratio = exportSize / 320;
      ctx.translate(exportSize / 2 + offset.x * ratio, exportSize / 2 + offset.y * ratio);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoom, zoom);

      const baseScale = Math.max(exportSize / img.naturalWidth, exportSize / img.naturalHeight);
      const drawWidth = img.naturalWidth * baseScale;
      const drawHeight = img.naturalHeight * baseScale;
      ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

      const dataUrl = exportCanvas.toDataURL('image/png', 0.95);
      await onSave(dataUrl);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save avatar.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Adjust Profile Avatar"
      description="Position, scale, and rotate your image for a 1:1 circular profile picture."
      maxWidth="md"
    >
      <div className="flex flex-col items-center gap-5 py-2">
        {errorMessage && (
          <div className="w-full flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Circular Viewport Preview Area */}
        <div className="relative w-80 h-80 rounded-2xl bg-surface border border-slate-700/80 overflow-hidden flex items-center justify-center select-none">
          {imageSrc ? (
            <>
              {/* Underlying Drawing Canvas */}
              <canvas
                ref={canvasRef}
                width={320}
                height={320}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className={`w-80 h-80 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
              />

              {/* Circular Overlay Mask */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div
                  className="w-64 h-64 rounded-full border-2 border-brand-500/90 shadow-[0_0_0_9999px_rgba(11,13,16,0.7)]"
                />
              </div>

              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] text-slate-300 pointer-events-none">
                Drag to reposition • Scroll/slider to zoom
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 text-slate-400 p-6 text-center">
              <Upload className="w-10 h-10 text-slate-500" />
              <p className="text-xs">No image selected or file was rejected.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                leftIcon={<Upload className="w-4 h-4" />}
              >
                Choose Image File
              </Button>
            </div>
          )}
        </div>

        {/* Controls Toolbar */}
        {imageSrc && (
          <div className="w-full space-y-4">
            {/* Zoom Slider */}
            <div className="flex items-center gap-3 px-2">
              <ZoomOut className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 accent-brand-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
              />
              <ZoomIn className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-xs font-mono text-slate-300 w-10 text-right">
                {zoom.toFixed(1)}x
              </span>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRotate}
                  leftIcon={<RotateCw className="w-3.5 h-3.5" />}
                  className="text-xs"
                >
                  Rotate 90°
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetTransforms}
                  leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                  className="text-xs"
                >
                  Reset
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs"
              >
                Change Photo
              </Button>
            </div>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png,image/jpeg,image/webp,image/jpg"
          className="hidden"
        />

        {/* Dialog Actions */}
        <div className="flex items-center justify-end gap-2 w-full pt-4 border-t border-slate-800">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleExportAndSave}
            disabled={!imageSrc || isSaving}
            isLoading={isSaving}
            leftIcon={<Check className="w-4 h-4" />}
          >
            Apply Avatar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
