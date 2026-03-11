import { useState, useCallback } from "react";
import { readSSEStream } from "@/lib/stream-utils";
import { addToHistory } from "@/pages/HistoryPage";

const MATH_DEMO_RESPONSES = [
  "# Solution\n\n",
  "## Problem\n\nLet's solve this step by step.\n\n",
  "## Step 1: Identify the Problem Type\n\n",
  "This is a calculus/algebra problem that requires systematic analysis.\n\n",
  "## Step 2: Set Up the Solution\n\n",
  "We begin by identifying the key variables and relationships:\n\n",
  "$$f(x) = x^3 + 2x$$\n\n",
  "## Step 3: Apply the Method\n\n",
  "Taking the derivative:\n\n",
  "$$f'(x) = 3x^2 + 2$$\n\n",
  "## Step 4: Evaluate\n\n",
  "Computing the definite integral from 0 to 3:\n\n",
  "$$\\int_0^3 (x^3 + 2x) \\, dx = \\left[\\frac{x^4}{4} + x^2\\right]_0^3$$\n\n",
  "$$= \\frac{81}{4} + 9 - 0 = \\frac{81}{4} + \\frac{36}{4} = \\frac{117}{4} = 29.25$$\n\n",
  "## Final Answer\n\n",
  "$$\\boxed{\\frac{117}{4} = 29.25}$$\n\n",
  "> **Demo Mode**: Connect a backend for real math solving with step-by-step proofs.",
];

export function useMathSolver() {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const solve = useCallback(async (prompt: string) => {
    setContent("");
    setIsLoading(true);
    setError(null);

    addToHistory({ query: prompt, source: "math", preview: "" });

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey || supabaseUrl === 'undefined') {
      let accumulated = "";
      for (const chunk of MATH_DEMO_RESPONSES) {
        await new Promise(r => setTimeout(r, 80 + Math.random() * 150));
        accumulated += chunk;
        setContent(accumulated);
      }
      setIsLoading(false);
      return;
    }

    let accumulated = "";
    const MATH_URL = `${supabaseUrl}/functions/v1/mega-math`;
    await readSSEStream({
      url: MATH_URL,
      body: { prompt },
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

  return { content, isLoading, error, solve, clear };
}
