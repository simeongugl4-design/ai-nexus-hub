import { useState, useCallback } from "react";
import { readSSEStream } from "@/lib/stream-utils";
import { addToHistory } from "@/pages/HistoryPage";

const IMAGE_URL_FN = () => `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mega-image`;

const DEMO_IMAGES = [
  "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=800",
  "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=800",
  "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800",
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800",
];

export function useImageAI() {
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (prompt: string, action: string = "generate") => {
    setContent("");
    setImageUrl(null);
    setIsLoading(true);
    setError(null);

    addToHistory({ query: prompt, source: "image", preview: action });

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey || supabaseUrl === 'undefined') {
      await new Promise(r => setTimeout(r, 2000));
      if (action === "analyze") {
        setContent("# Image Analysis (Demo)\n\n## Visual Elements\n\n- **Composition**: The image features a dynamic arrangement of elements\n- **Color Palette**: Rich, vibrant colors with high contrast\n- **Lighting**: Natural lighting with soft shadows\n- **Style**: Modern digital art aesthetic\n\n## Technical Details\n\n| Property | Value |\n|----------|-------|\n| Resolution | 1024x1024 |\n| Format | PNG |\n| Color Space | sRGB |\n\n> **Demo Mode**: Connect a backend for real image analysis.");
      } else {
        const randomImg = DEMO_IMAGES[Math.floor(Math.random() * DEMO_IMAGES.length)];
        setImageUrl(randomImg);
        setContent(`**Generated**: "${prompt}"\n\n*This is a demo image from Unsplash. Connect a backend AI service for real image generation.*`);
      }
      setIsLoading(false);
      return;
    }

    if (action === "analyze") {
      let accumulated = "";
      await readSSEStream({
        url: IMAGE_URL_FN(),
        body: { prompt, action },
        onDelta: (chunk) => {
          accumulated += chunk;
          setContent(accumulated);
        },
        onDone: () => setIsLoading(false),
        onError: (err) => {
          setIsLoading(false);
          setError(err);
        },
      });
    } else {
      try {
        const resp = await fetch(IMAGE_URL_FN(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ prompt, action }),
        });

        if (!resp.ok) {
          const data = await resp.json().catch(() => ({ error: "Request failed" }));
          setError(data.error || `Error: ${resp.status}`);
          setIsLoading(false);
          return;
        }

        const data = await resp.json();
        setImageUrl(data.imageUrl);
        setContent(data.text || "");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Connection failed");
      } finally {
        setIsLoading(false);
      }
    }
  }, []);

  const clear = useCallback(() => {
    setContent("");
    setImageUrl(null);
    setError(null);
  }, []);

  return { content, imageUrl, isLoading, error, generate, clear };
}
