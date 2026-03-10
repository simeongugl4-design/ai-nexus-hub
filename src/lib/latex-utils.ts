/**
 * Preprocesses LaTeX content to fix common rendering issues.
 */

const MATH_ENVS = [
  "aligned", "align", "align\\*", "cases", "pmatrix", "bmatrix",
  "vmatrix", "matrix", "gathered", "split", "array", "eqnarray",
  "equation", "equation\\*",
];

const ENV_PATTERN = MATH_ENVS.join("|");

export function preprocessLatex(content: string): string {
  if (!content) return content;

  let result = content;

  // Wrap bare \begin{env}...\end{env} blocks
  const bareEnvRegex = new RegExp(
    `(?<![\\$])\\\\begin\\{(${ENV_PATTERN})\\}([\\s\\S]*?)\\\\end\\{\\1\\}(?![\\$])`,
    "g"
  );
  result = result.replace(bareEnvRegex, (_match, env, body) => {
    return `$$\\begin{${env}}${body}\\end{${env}}$$`;
  });

  // Wrap bare \boxed{...}
  result = result.replace(
    /(?<!\$)\\boxed\{([^}]+)\}(?!\$)/g,
    "$$\\boxed{$1}$$"
  );

  // Fix double-escaped backslashes in math environments
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_match, inner) => {
    const fixed = inner.replace(/\\\\\\\\/g, "\\\\");
    return `$$${fixed}$$`;
  });

  // Ensure $$ blocks have proper newlines
  result = result.replace(/([^\n])\$\$/g, "$1\n$$");
  result = result.replace(/\$\$([^\n])/g, "$$\n$1");

  return result;
}
