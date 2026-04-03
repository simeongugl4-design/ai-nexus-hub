import { useState, useCallback } from "react";
import { readSSEStream } from "@/lib/stream-utils";
import { addToHistory } from "@/pages/HistoryPage";

const MATH_PROBLEMS: Record<string, string[]> = {
  integral: [
    "# Solution: Definite Integral\n\n",
    "## Problem\n\n$$\\int_0^3 (x^3 + 2x) \\, dx$$\n\n",
    "## Step 1: Find the Antiderivative\n\nApply the power rule of integration to each term:\n\n",
    "$$\\int x^n \\, dx = \\frac{x^{n+1}}{n+1} + C$$\n\n",
    "For the first term:\n$$\\int x^3 \\, dx = \\frac{x^4}{4}$$\n\n",
    "For the second term:\n$$\\int 2x \\, dx = \\frac{2x^2}{2} = x^2$$\n\n",
    "Therefore the antiderivative is:\n$$F(x) = \\frac{x^4}{4} + x^2$$\n\n",
    "## Step 2: Apply the Fundamental Theorem of Calculus\n\n",
    "$$\\int_a^b f(x) \\, dx = F(b) - F(a)$$\n\n",
    "## Step 3: Evaluate at the Bounds\n\n**Upper bound** ($x = 3$):\n",
    "$$F(3) = \\frac{3^4}{4} + 3^2 = \\frac{81}{4} + 9 = \\frac{81}{4} + \\frac{36}{4} = \\frac{117}{4}$$\n\n",
    "**Lower bound** ($x = 0$):\n$$F(0) = \\frac{0^4}{4} + 0^2 = 0$$\n\n",
    "## Step 4: Subtract\n\n$$\\int_0^3 (x^3 + 2x) \\, dx = F(3) - F(0) = \\frac{117}{4} - 0 = \\frac{117}{4}$$\n\n",
    "## Final Answer\n\n$$\\boxed{\\frac{117}{4} = 29.25}$$\n\n",
    "### Verification\n\nUsing numerical approximation with the trapezoidal rule confirms our result: $\\approx 29.25$ ✓\n\n",
    "> **Demo Mode**: Connect a backend for real AI-powered math solving.",
  ],
  eigenvalue: [
    "# Solution: Eigenvalues of a Matrix\n\n",
    "## Problem\n\nFind the eigenvalues of:\n$$A = \\begin{pmatrix} 3 & 1 \\\\ 1 & 3 \\end{pmatrix}$$\n\n",
    "## Step 1: Set Up the Characteristic Equation\n\nEigenvalues satisfy $\\det(A - \\lambda I) = 0$\n\n",
    "$$A - \\lambda I = \\begin{pmatrix} 3 - \\lambda & 1 \\\\ 1 & 3 - \\lambda \\end{pmatrix}$$\n\n",
    "## Step 2: Compute the Determinant\n\n",
    "$$\\det(A - \\lambda I) = (3 - \\lambda)(3 - \\lambda) - (1)(1)$$\n\n",
    "$$= (3 - \\lambda)^2 - 1$$\n\n",
    "$$= 9 - 6\\lambda + \\lambda^2 - 1$$\n\n",
    "$$= \\lambda^2 - 6\\lambda + 8$$\n\n",
    "## Step 3: Solve the Quadratic\n\nUsing the quadratic formula:\n",
    "$$\\lambda = \\frac{6 \\pm \\sqrt{36 - 32}}{2} = \\frac{6 \\pm \\sqrt{4}}{2} = \\frac{6 \\pm 2}{2}$$\n\n",
    "$$\\lambda_1 = \\frac{6 + 2}{2} = 4 \\qquad \\lambda_2 = \\frac{6 - 2}{2} = 2$$\n\n",
    "## Step 4: Find Eigenvectors\n\n**For $\\lambda_1 = 4$:**\n",
    "$$\\begin{pmatrix} -1 & 1 \\\\ 1 & -1 \\end{pmatrix} \\mathbf{v} = \\mathbf{0} \\implies \\mathbf{v}_1 = \\begin{pmatrix} 1 \\\\ 1 \\end{pmatrix}$$\n\n",
    "**For $\\lambda_2 = 2$:**\n",
    "$$\\begin{pmatrix} 1 & 1 \\\\ 1 & 1 \\end{pmatrix} \\mathbf{v} = \\mathbf{0} \\implies \\mathbf{v}_2 = \\begin{pmatrix} 1 \\\\ -1 \\end{pmatrix}$$\n\n",
    "## Final Answer\n\n$$\\boxed{\\lambda_1 = 4, \\quad \\lambda_2 = 2}$$\n\n",
    "| Eigenvalue | Eigenvector | Multiplicity |\n|:---:|:---:|:---:|\n| $\\lambda_1 = 4$ | $(1, 1)^T$ | 1 |\n| $\\lambda_2 = 2$ | $(1, -1)^T$ | 1 |\n\n",
    "> **Demo Mode**: Connect a backend for real AI-powered math solving.",
  ],
  differential: [
    "# Solution: Differential Equation\n\n",
    "## Problem\n\n$$\\frac{dy}{dx} = 2xy, \\quad y(0) = 1$$\n\n",
    "## Step 1: Identify the Type\n\nThis is a **first-order separable** ODE. We can separate variables $y$ and $x$.\n\n",
    "## Step 2: Separate Variables\n\n$$\\frac{dy}{y} = 2x \\, dx$$\n\n",
    "## Step 3: Integrate Both Sides\n\n$$\\int \\frac{1}{y} \\, dy = \\int 2x \\, dx$$\n\n",
    "$$\\ln|y| = x^2 + C$$\n\n",
    "## Step 4: Solve for $y$\n\n$$|y| = e^{x^2 + C} = e^C \\cdot e^{x^2}$$\n\n",
    "Let $A = \\pm e^C$:\n$$y = A \\cdot e^{x^2}$$\n\n",
    "## Step 5: Apply Initial Condition\n\n$$y(0) = 1 \\implies A \\cdot e^{0} = 1 \\implies A = 1$$\n\n",
    "## Final Answer\n\n$$\\boxed{y(x) = e^{x^2}}$$\n\n",
    "### Properties of the Solution\n\n| $x$ | $y = e^{x^2}$ |\n|:---:|:---:|\n| $0$ | $1.000$ |\n| $0.5$ | $1.284$ |\n| $1$ | $2.718$ |\n| $1.5$ | $9.488$ |\n| $2$ | $54.598$ |\n\n",
    "The solution grows **super-exponentially** — faster than any standard exponential function.\n\n",
    "> **Demo Mode**: Connect a backend for real AI-powered math solving.",
  ],
  sqrt2: [
    "# Proof: $\\sqrt{2}$ is Irrational\n\n",
    "## Method: Proof by Contradiction\n\n",
    "**Assume** $\\sqrt{2}$ is rational. Then we can write:\n\n$$\\sqrt{2} = \\frac{p}{q}$$\n\n",
    "where $p, q \\in \\mathbb{Z}$, $q \\neq 0$, and $\\gcd(p, q) = 1$ (fully reduced).\n\n",
    "## Step 1: Square Both Sides\n\n$$2 = \\frac{p^2}{q^2}$$\n\n$$p^2 = 2q^2$$\n\n",
    "## Step 2: Deduce $p$ is Even\n\nSince $p^2 = 2q^2$, we know $p^2$ is even.\n\n**Lemma**: If $n^2$ is even, then $n$ is even.\n\n*Proof*: If $n$ were odd, $n = 2k+1$, then $n^2 = 4k^2 + 4k + 1$ (odd). Contradiction. ✓\n\n",
    "Therefore $p$ is even, so $p = 2m$ for some integer $m$.\n\n",
    "## Step 3: Substitute\n\n$$(2m)^2 = 2q^2$$\n$$4m^2 = 2q^2$$\n$$q^2 = 2m^2$$\n\n",
    "## Step 4: Deduce $q$ is Even\n\nBy the same lemma, $q^2 = 2m^2$ implies $q$ is even.\n\n",
    "## Step 5: Contradiction\n\nBoth $p$ and $q$ are even, meaning $\\gcd(p, q) \\geq 2$.\n\nThis **contradicts** our assumption that $\\gcd(p, q) = 1$.\n\n",
    "## Conclusion\n\n$$\\boxed{\\sqrt{2} \\text{ is irrational.}} \\quad \\blacksquare$$\n\n",
    "> **Demo Mode**: Connect a backend for real AI-powered math solving.",
  ],
  area: [
    "# Solution: Area Between Curves\n\n",
    "## Problem\n\nFind the area between $y = x^2$ and $y = 2x$.\n\n",
    "## Step 1: Find Intersection Points\n\nSet $x^2 = 2x$:\n$$x^2 - 2x = 0$$\n$$x(x - 2) = 0$$\n$$x = 0 \\quad \\text{or} \\quad x = 2$$\n\n",
    "## Step 2: Determine Which Function is Greater\n\nFor $0 < x < 2$, test $x = 1$:\n- $y = x^2 = 1$\n- $y = 2x = 2$\n\nSo $2x > x^2$ on the interval $[0, 2]$.\n\n",
    "## Step 3: Set Up the Integral\n\n$$A = \\int_0^2 (2x - x^2) \\, dx$$\n\n",
    "## Step 4: Evaluate\n\n$$A = \\left[ x^2 - \\frac{x^3}{3} \\right]_0^2$$\n\n",
    "$$= \\left( 4 - \\frac{8}{3} \\right) - (0)$$\n\n",
    "$$= \\frac{12}{3} - \\frac{8}{3} = \\frac{4}{3}$$\n\n",
    "## Final Answer\n\n$$\\boxed{A = \\frac{4}{3} \\approx 1.333 \\text{ square units}}$$\n\n",
    "| Point | $y = x^2$ | $y = 2x$ | Difference |\n|:---:|:---:|:---:|:---:|\n| $x = 0$ | $0$ | $0$ | $0$ |\n| $x = 0.5$ | $0.25$ | $1$ | $0.75$ |\n| $x = 1$ | $1$ | $2$ | $1$ |\n| $x = 1.5$ | $2.25$ | $3$ | $0.75$ |\n| $x = 2$ | $4$ | $4$ | $0$ |\n\n",
    "> **Demo Mode**: Connect a backend for real AI-powered math solving.",
  ],
  system: [
    "# Solution: System of Linear Equations\n\n",
    "## Problem\n\n$$\\begin{cases} 3x + 2y = 7 \\\\ x - y = 1 \\end{cases}$$\n\n",
    "## Method 1: Substitution\n\n### Step 1: Solve Equation 2 for $x$\n\n$$x = y + 1$$\n\n",
    "### Step 2: Substitute into Equation 1\n\n$$3(y + 1) + 2y = 7$$\n$$3y + 3 + 2y = 7$$\n$$5y = 4$$\n$$y = \\frac{4}{5} = 0.8$$\n\n",
    "### Step 3: Back-substitute\n\n$$x = y + 1 = \\frac{4}{5} + 1 = \\frac{9}{5} = 1.8$$\n\n",
    "## Method 2: Matrix Solution (Cramer's Rule)\n\n",
    "$$A = \\begin{pmatrix} 3 & 2 \\\\ 1 & -1 \\end{pmatrix}, \\quad \\mathbf{b} = \\begin{pmatrix} 7 \\\\ 1 \\end{pmatrix}$$\n\n",
    "$$\\det(A) = (3)(-1) - (2)(1) = -3 - 2 = -5$$\n\n",
    "$$x = \\frac{\\det \\begin{pmatrix} 7 & 2 \\\\ 1 & -1 \\end{pmatrix}}{-5} = \\frac{-7 - 2}{-5} = \\frac{-9}{-5} = \\frac{9}{5}$$\n\n",
    "$$y = \\frac{\\det \\begin{pmatrix} 3 & 7 \\\\ 1 & 1 \\end{pmatrix}}{-5} = \\frac{3 - 7}{-5} = \\frac{-4}{-5} = \\frac{4}{5}$$\n\n",
    "## Verification\n\n$$3 \\cdot \\frac{9}{5} + 2 \\cdot \\frac{4}{5} = \\frac{27}{5} + \\frac{8}{5} = \\frac{35}{5} = 7 \\quad \\checkmark$$\n\n",
    "$$\\frac{9}{5} - \\frac{4}{5} = \\frac{5}{5} = 1 \\quad \\checkmark$$\n\n",
    "## Final Answer\n\n$$\\boxed{x = \\frac{9}{5} = 1.8, \\quad y = \\frac{4}{5} = 0.8}$$\n\n",
    "> **Demo Mode**: Connect a backend for real AI-powered math solving.",
  ],
};

function selectDemoResponse(prompt: string): string[] {
  const lower = prompt.toLowerCase();
  if (lower.includes("integral") || lower.includes("∫")) return MATH_PROBLEMS.integral;
  if (lower.includes("eigenvalue") || lower.includes("matrix")) return MATH_PROBLEMS.eigenvalue;
  if (lower.includes("differential") || lower.includes("dy/dx") || lower.includes("dy dx")) return MATH_PROBLEMS.differential;
  if (lower.includes("√2") || lower.includes("sqrt") || lower.includes("irrational")) return MATH_PROBLEMS.sqrt2;
  if (lower.includes("area between") || lower.includes("area")) return MATH_PROBLEMS.area;
  if (lower.includes("system") || lower.includes("3x") || lower.includes("solve the system")) return MATH_PROBLEMS.system;
  // Default: pick based on hash
  const keys = Object.keys(MATH_PROBLEMS);
  const hash = prompt.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return MATH_PROBLEMS[keys[hash % keys.length]];
}

export function useMathSolver() {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const solve = useCallback(async (prompt: string, model?: string) => {
    setContent("");
    setIsLoading(true);
    setError(null);

    addToHistory({ query: prompt, source: "math", preview: "" });

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey || supabaseUrl === 'undefined') {
      const chunks = selectDemoResponse(prompt);
      let accumulated = "";
      for (const chunk of chunks) {
        await new Promise(r => setTimeout(r, 60 + Math.random() * 100));
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
      body: { prompt, model },
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
