export interface GalleryItem {
  id: string;
  imageUrl: string;
  prompt: string;
  source: "diagram" | "image";
  style?: string;
  createdAt: string;
}

const GALLERY_KEY = "megakumul-gallery";

function getAll(): GalleryItem[] {
  try {
    return JSON.parse(localStorage.getItem(GALLERY_KEY) || "[]");
  } catch {
    return [];
  }
}

function save(items: GalleryItem[]) {
  localStorage.setItem(GALLERY_KEY, JSON.stringify(items));
}

export function addToGallery(item: Omit<GalleryItem, "id" | "createdAt">): GalleryItem {
  const entry: GalleryItem = {
    ...item,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const items = getAll();
  items.unshift(entry);
  // Keep max 50 items to avoid localStorage limits
  save(items.slice(0, 50));
  return entry;
}

export function getGallery(): GalleryItem[] {
  return getAll();
}

export function removeFromGallery(id: string) {
  save(getAll().filter((i) => i.id !== id));
}

export function clearGallery() {
  localStorage.removeItem(GALLERY_KEY);
}
