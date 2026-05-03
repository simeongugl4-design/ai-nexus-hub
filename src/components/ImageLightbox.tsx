import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { hapticSelection } from "@/lib/native";

interface ImageLightboxProps {
  images: string[];
  startIndex: number;
  open: boolean;
  onClose: () => void;
}

export function ImageLightbox({ images, startIndex, open, onClose }: ImageLightboxProps) {
  const [index, setIndex] = useState(startIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (open) {
      setIndex(startIndex);
      setZoom(1);
      setRotation(0);
    }
  }, [open, startIndex]);

  const next = useCallback(() => {
    hapticSelection();
    setIndex((i) => (i + 1) % images.length);
    setZoom(1);
    setRotation(0);
  }, [images.length]);

  const prev = useCallback(() => {
    hapticSelection();
    setIndex((i) => (i - 1 + images.length) % images.length);
    setZoom(1);
    setRotation(0);
  }, [images.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(z + 0.25, 4));
      else if (e.key === "-") setZoom((z) => Math.max(z - 0.25, 0.5));
      else if (e.key.toLowerCase() === "r") setRotation((r) => (r + 90) % 360);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, next, prev, onClose]);

  const handleDownload = async () => {
    try {
      const url = images[index];
      const a = document.createElement("a");
      a.href = url;
      a.download = `image-${index + 1}.${url.includes("image/png") ? "png" : "jpg"}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      /* ignore */
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-xl"
          onClick={onClose}
        >
          {/* Top bar */}
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 z-10" onClick={(e) => e.stopPropagation()}>
            <div className="text-sm text-muted-foreground tabular-nums">
              {index + 1} / {images.length}
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))} className="rounded-lg bg-card/80 p-2 text-foreground hover:bg-card border border-border" title="Zoom out (-)">
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="text-xs text-muted-foreground tabular-nums w-12 text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom((z) => Math.min(z + 0.25, 4))} className="rounded-lg bg-card/80 p-2 text-foreground hover:bg-card border border-border" title="Zoom in (+)">
                <ZoomIn className="h-4 w-4" />
              </button>
              <button onClick={() => setRotation((r) => (r + 90) % 360)} className="rounded-lg bg-card/80 p-2 text-foreground hover:bg-card border border-border" title="Rotate (R)">
                <RotateCw className="h-4 w-4" />
              </button>
              <button onClick={handleDownload} className="rounded-lg bg-card/80 p-2 text-foreground hover:bg-card border border-border" title="Download">
                <Download className="h-4 w-4" />
              </button>
              <button onClick={onClose} className="rounded-lg bg-card/80 p-2 text-foreground hover:bg-card border border-border" title="Close (Esc)">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Prev / Next */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-card/80 p-3 text-foreground hover:bg-card border border-border z-10"
                title="Previous (←)"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-card/80 p-3 text-foreground hover:bg-card border border-border z-10"
                title="Next (→)"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {/* Image */}
          <motion.img
            key={index}
            src={images[index]}
            alt={`image ${index + 1}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: zoom, rotate: rotation }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", damping: 24, stiffness: 220 }}
            className="max-h-[85vh] max-w-[90vw] select-none rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            draggable={false}
          />

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="absolute inset-x-0 bottom-4 flex justify-center" onClick={(e) => e.stopPropagation()}>
              <div className="flex gap-2 rounded-xl border border-border bg-card/80 p-2 backdrop-blur">
                {images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => { setIndex(i); setZoom(1); setRotation(0); hapticSelection(); }}
                    className={`relative h-12 w-12 overflow-hidden rounded-md border-2 transition ${
                      i === index ? "border-primary ring-2 ring-primary/40" : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={src} alt={`thumb ${i + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
