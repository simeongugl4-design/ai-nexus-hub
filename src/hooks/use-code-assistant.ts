import { useState, useCallback } from "react";
import { readSSEStream } from "@/lib/stream-utils";
import { addToHistory } from "@/pages/HistoryPage";

const CODE_DEMO_RESPONSES: Record<string, string[]> = {
  generate: [
    "# Code Generation\n\n",
    "Here's the code you requested:\n\n",
    "```typescript\n",
    "// MegaKUMUL Generated Code\n",
    "import express from 'express';\n\n",
    "const app = express();\n",
    "const PORT = 3000;\n\n",
    "app.use(express.json());\n\n",
    "// Routes\n",
    "app.get('/api/health', (req, res) => {\n",
    "  res.json({ status: 'ok', timestamp: new Date().toISOString() });\n",
    "});\n\n",
    "app.get('/api/data', async (req, res) => {\n",
    "  try {\n",
    "    const data = await fetchData();\n",
    "    res.json({ success: true, data });\n",
    "  } catch (error) {\n",
    "    res.status(500).json({ error: 'Internal server error' });\n",
    "  }\n",
    "});\n\n",
    "app.listen(PORT, () => {\n",
    "  console.log(`Server running on port ${PORT}`);\n",
    "});\n",
    "```\n\n",
    "## Explanation\n\n",
    "- **Express setup**: Basic Express.js server with JSON middleware\n",
    "- **Health endpoint**: Returns server status\n",
    "- **Data endpoint**: Async handler with error handling\n\n",
    "> **Demo Mode**: Connect a backend for real AI code generation.",
  ],
  debug: [
    "# Bug Analysis\n\n",
    "I've identified the following issues:\n\n",
    "## 🐛 Issues Found\n\n",
    "1. **Memory Leak**: The event listener is not being cleaned up\n",
    "2. **Race Condition**: Async operations may conflict\n",
    "3. **Type Error**: Missing null check on line 15\n\n",
    "## ✅ Fixes\n\n",
    "```typescript\n// Fixed version\nuseEffect(() => {\n  const handler = () => { /* ... */ };\n  window.addEventListener('resize', handler);\n  return () => window.removeEventListener('resize', handler);\n}, []);\n```\n\n",
    "> **Demo Mode**: Connect a backend for real debugging analysis.",
  ],
  explain: [
    "# Code Explanation\n\n",
    "## Overview\n\nThis code implements a **reactive data pipeline** pattern:\n\n",
    "### How It Works\n\n",
    "1. **Input Layer**: Data enters through the event emitter\n",
    "2. **Transform Layer**: Map/filter/reduce operations process the stream\n",
    "3. **Output Layer**: Results are batched and flushed periodically\n\n",
    "### Key Concepts\n\n",
    "- **Backpressure**: Controls flow to prevent memory overflow\n",
    "- **Lazy Evaluation**: Operations only execute when data is consumed\n",
    "- **Immutability**: Each transform creates a new stream reference\n\n",
    "> **Demo Mode**: Connect a backend for real code explanations.",
  ],
  optimize: [
    "# Performance Optimization\n\n",
    "## Analysis Results\n\n",
    "| Metric | Before | After | Improvement |\n|--------|--------|-------|-------------|\n",
    "| Execution Time | 450ms | 120ms | 73% faster |\n| Memory Usage | 85MB | 32MB | 62% less |\n| Bundle Size | 1.2MB | 480KB | 60% smaller |\n\n",
    "## Optimizations Applied\n\n",
    "1. **Memoization**: Added `useMemo` for expensive computations\n",
    "2. **Code Splitting**: Lazy load heavy modules\n",
    "3. **Tree Shaking**: Removed unused imports\n\n",
    "> **Demo Mode**: Connect a backend for real optimization analysis.",
  ],
};

export function useCodeAssistant() {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (prompt: string, language: string, action: string, model?: string) => {
    setContent("");
    setIsLoading(true);
    setError(null);

    addToHistory({ query: prompt, source: "code", preview: `${action} - ${language}` });

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey || supabaseUrl === 'undefined') {
      const chunks = CODE_DEMO_RESPONSES[action] || CODE_DEMO_RESPONSES.generate;
      let accumulated = "";
      for (const chunk of chunks) {
        await new Promise(r => setTimeout(r, 60 + Math.random() * 120));
        accumulated += chunk;
        setContent(accumulated);
      }
      setIsLoading(false);
      return;
    }

    let accumulated = "";
    const CODE_URL = `${supabaseUrl}/functions/v1/mega-code`;
    await readSSEStream({
      url: CODE_URL,
      body: { prompt, language, action, model },
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
  }, []);

  const clear = useCallback(() => {
    setContent("");
    setError(null);
  }, []);

  return { content, isLoading, error, generate, clear };
}
