import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImageIcon, Trash2, Download, ZoomIn, ZoomOut, X, Box, Sparkles } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import { getGallery, removeFromGallery, clearGallery, GalleryItem } from "@/lib/gallery";

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [selectedModel, setSelectedModel] = useState("creative");
  const [viewItem, setViewItem] = useState<GalleryItem | null>(null);
  const [zoom, setZoom] = useState(1);
  const [filter, setFilter] = useState<"all" | "diagram" | "image">("all");

  useEffect(() => {
    setItems(getGallery());
  }, []);

  const handleDelete = (id: string) => {
    removeFromGallery(id);
    setItems(getGallery());
    if (viewItem?.id === id) setViewItem(null);
  };

  const handleClearAll = () => {
    clearGallery();
    setItems([]);
    setViewItem(null);
  };

  const handleDownload = (item: GalleryItem) => {
    const a = document.createElement("a");
    a.href = item.imageUrl;
    a.download = `megakumul-${item.source}-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const filtered = filter === "all" ? items : items.filter((i) => i.source === filter);

  return (
    <div className="flex h-screen flex-col">
      <TopNav selectedModel={selectedModel} onModelChange={setSelectedModel} />
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto max-w-6xl px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-heading font-bold gradient-text">Gallery</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {items.length} saved {items.length === 1 ? "item" : "items"}
              </p>
            </div>
            {items.length > 0 && (
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3 w-3" /> Clear All
              </button>
            )}
          </div>

          {/* Filters */}
          {items.length > 0 && (
            <div className="flex gap-2 mb-6">
              {(["all", "diagram", "image"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-lg px-4 py-2 text-xs font-medium transition-all ${
                    filter === f
                      ? "bg-primary text-primary-foreground"
                      : "border border-border text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  {f === "all" ? "All" : f === "diagram" ? "Diagrams" : "Images"}
                </button>
              ))}
            </div>
          )}

          {/* Empty state */}
          {items.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
                <ImageIcon className="h-10 w-10 text-primary/50" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">No saved items yet</h2>
              <p className="max-w-md text-sm text-muted-foreground">
                Generate diagrams or images and click the save button to add them to your gallery.
              </p>
            </motion.div>
          )}

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filtered.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/30 transition-colors"
                >
                  <div
                    className="relative aspect-[4/3] cursor-pointer overflow-hidden bg-background"
                    onClick={() => { setViewItem(item); setZoom(1); }}
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.prompt}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute top-2 left-2">
                      <span className="inline-flex items-center gap-1 rounded-md bg-background/80 backdrop-blur-sm px-2 py-1 text-[10px] font-medium text-foreground">
                        {item.source === "diagram" ? <Box className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
                        {item.source === "diagram" ? "Diagram" : "Image"}
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{item.prompt}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground/60">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDownload(item); }}
                          className="p-1 text-muted-foreground hover:text-foreground"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                          className="p-1 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {viewItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm p-4"
            onClick={() => setViewItem(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-4xl w-full max-h-[90vh] rounded-2xl border border-border bg-card overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/50">
                <span className="text-xs text-muted-foreground line-clamp-1 flex-1 mr-4">{viewItem.prompt}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))} className="p-1.5 text-muted-foreground hover:text-foreground"><ZoomOut className="h-4 w-4" /></button>
                  <span className="text-xs text-muted-foreground min-w-[3rem] text-center">{Math.round(zoom * 100)}%</span>
                  <button onClick={() => setZoom((z) => Math.min(3, z + 0.25))} className="p-1.5 text-muted-foreground hover:text-foreground"><ZoomIn className="h-4 w-4" /></button>
                  <button onClick={() => handleDownload(viewItem)} className="p-1.5 text-muted-foreground hover:text-foreground ml-1"><Download className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(viewItem.id)} className="p-1.5 text-muted-foreground hover:text-destructive ml-1"><Trash2 className="h-4 w-4" /></button>
                  <button onClick={() => setViewItem(null)} className="p-1.5 text-muted-foreground hover:text-foreground ml-1"><X className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="overflow-auto max-h-[calc(90vh-3rem)] flex items-center justify-center p-4 bg-background">
                <img
                  src={viewItem.imageUrl}
                  alt={viewItem.prompt}
                  className="rounded-lg transition-transform"
                  style={{ transform: `scale(${zoom})` }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
