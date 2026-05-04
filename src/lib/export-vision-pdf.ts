import { jsPDF } from "jspdf";
import { toast } from "sonner";

type Opts = {
  title?: string;
  model?: string;
  prompt?: string;
  images: string[];
  analysis: string;
};

const BRAND = { r: 0, g: 188, b: 212 };
const INK = { r: 22, g: 27, b: 34 };
const MUTED = { r: 110, g: 120, b: 135 };
const RULE = { r: 220, g: 226, b: 232 };

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function imageToDataUrl(src: string): Promise<{ data: string; w: number; h: number; fmt: "JPEG" | "PNG" }> {
  if (src.startsWith("data:image/")) {
    const fmt: "JPEG" | "PNG" = src.startsWith("data:image/png") ? "PNG" : "JPEG";
    const img = await loadImage(src);
    return { data: src, w: img.naturalWidth, h: img.naturalHeight, fmt };
  }
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  return { data: canvas.toDataURL("image/jpeg", 0.92), w: canvas.width, h: canvas.height, fmt: "JPEG" };
}

// Lightweight markdown → blocks (headings, lists, paragraphs, code, hr)
type Block =
  | { type: "h1" | "h2" | "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "li"; text: string; ordered: boolean; n?: number }
  | { type: "code"; text: string }
  | { type: "quote"; text: string }
  | { type: "hr" };

function parseMarkdown(md: string): Block[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: Block[] = [];
  let inCode = false;
  let codeBuf: string[] = [];
  let orderedCounter = 0;
  let paraBuf: string[] = [];

  const flushPara = () => {
    if (paraBuf.length) {
      out.push({ type: "p", text: paraBuf.join(" ").trim() });
      paraBuf = [];
    }
  };

  for (const raw of lines) {
    const line = raw;
    if (line.trim().startsWith("```")) {
      if (inCode) {
        out.push({ type: "code", text: codeBuf.join("\n") });
        codeBuf = [];
        inCode = false;
      } else {
        flushPara();
        inCode = true;
      }
      continue;
    }
    if (inCode) { codeBuf.push(line); continue; }

    if (!line.trim()) { flushPara(); orderedCounter = 0; continue; }
    if (/^\s*---+\s*$/.test(line)) { flushPara(); out.push({ type: "hr" }); continue; }

    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      flushPara();
      const lvl = h[1].length as 1 | 2 | 3;
      out.push({ type: (`h${lvl}` as "h1" | "h2" | "h3"), text: stripInline(h[2]) });
      continue;
    }
    const ul = line.match(/^\s*[-*]\s+(.*)$/);
    if (ul) { flushPara(); out.push({ type: "li", text: stripInline(ul[1]), ordered: false }); continue; }
    const ol = line.match(/^\s*(\d+)\.\s+(.*)$/);
    if (ol) { flushPara(); orderedCounter += 1; out.push({ type: "li", text: stripInline(ol[2]), ordered: true, n: orderedCounter }); continue; }
    const q = line.match(/^>\s?(.*)$/);
    if (q) { flushPara(); out.push({ type: "quote", text: stripInline(q[1]) }); continue; }

    paraBuf.push(stripInline(line));
  }
  if (inCode && codeBuf.length) out.push({ type: "code", text: codeBuf.join("\n") });
  flushPara();
  return out;
}

function stripInline(s: string): string {
  return s
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}

export async function exportVisionPDF({ title, model, prompt, images, analysis }: Opts) {
  const t = toast.loading("Generating PDF report…");
  try {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const PW = doc.internal.pageSize.getWidth();
    const PH = doc.internal.pageSize.getHeight();
    const M = 48;
    let y = M;
    let page = 1;

    const drawHeader = () => {
      doc.setFillColor(BRAND.r, BRAND.g, BRAND.b);
      doc.rect(0, 0, PW, 6, "F");
      doc.setFontSize(9);
      doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
      doc.text("MegaKUMUL · Vision Analysis Report", M, 22);
      doc.text(new Date().toLocaleString(), PW - M, 22, { align: "right" });
      doc.setDrawColor(RULE.r, RULE.g, RULE.b);
      doc.line(M, 30, PW - M, 30);
    };
    const drawFooter = () => {
      doc.setFontSize(9);
      doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
      doc.text(`Page ${page}`, PW / 2, PH - 18, { align: "center" });
      doc.text("Confidential · AI-generated", M, PH - 18);
      doc.text("megakumul.ai", PW - M, PH - 18, { align: "right" });
    };
    const newPage = () => {
      drawFooter();
      doc.addPage();
      page += 1;
      y = M;
      drawHeader();
      y = 50;
    };
    const ensure = (h: number) => { if (y + h > PH - 40) newPage(); };

    drawHeader();
    y = 60;

    // Title
    doc.setTextColor(INK.r, INK.g, INK.b);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    const ttl = title || "AI Image Analysis Report";
    const ttlLines = doc.splitTextToSize(ttl, PW - 2 * M);
    doc.text(ttlLines, M, y);
    y += ttlLines.length * 26;

    // Meta box
    doc.setDrawColor(RULE.r, RULE.g, RULE.b);
    doc.setFillColor(248, 250, 252);
    const metaH = 64;
    doc.roundedRect(M, y, PW - 2 * M, metaH, 6, 6, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(INK.r, INK.g, INK.b);
    doc.text("Model", M + 12, y + 18);
    doc.text("Images", M + 180, y + 18);
    doc.text("Generated", M + 320, y + 18);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 70, 85);
    doc.text(model || "auto", M + 12, y + 34);
    doc.text(String(images.length), M + 180, y + 34);
    doc.text(new Date().toLocaleString(), M + 320, y + 34);
    if (prompt) {
      doc.setFont("helvetica", "italic");
      doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
      const p = doc.splitTextToSize(`Prompt: ${prompt}`, PW - 2 * M - 24);
      doc.text(p[0] ?? "", M + 12, y + 54);
    }
    y += metaH + 18;

    // Images section
    if (images.length) {
      ensure(28);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(BRAND.r, BRAND.g, BRAND.b);
      doc.text("Analyzed Images", M, y);
      y += 16;
      doc.setDrawColor(RULE.r, RULE.g, RULE.b);
      doc.line(M, y, PW - M, y);
      y += 14;

      const colW = (PW - 2 * M - 12) / 2;
      let col = 0;
      let rowMaxH = 0;
      for (let i = 0; i < images.length; i++) {
        try {
          const im = await imageToDataUrl(images[i]);
          const ratio = im.h / im.w;
          const w = colW;
          const h = Math.min(220, w * ratio);
          ensure(h + 26);
          const x = M + col * (colW + 12);
          doc.setDrawColor(RULE.r, RULE.g, RULE.b);
          doc.roundedRect(x - 2, y - 2, w + 4, h + 4, 4, 4, "S");
          doc.addImage(im.data, im.fmt, x, y, w, h, undefined, "FAST");
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
          doc.text(`Image ${i + 1} · ${im.w}×${im.h}`, x, y + h + 14);
          rowMaxH = Math.max(rowMaxH, h);
          col += 1;
          if (col >= 2) { col = 0; y += rowMaxH + 26; rowMaxH = 0; }
        } catch {
          // skip broken
        }
      }
      if (col !== 0) { y += rowMaxH + 26; }
      y += 6;
    }

    // Analysis section
    ensure(28);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(BRAND.r, BRAND.g, BRAND.b);
    doc.text("Detailed Analysis", M, y);
    y += 16;
    doc.setDrawColor(RULE.r, RULE.g, RULE.b);
    doc.line(M, y, PW - M, y);
    y += 14;

    const blocks = parseMarkdown(analysis || "_No analysis available._");
    const maxW = PW - 2 * M;

    for (const b of blocks) {
      if (b.type === "hr") {
        ensure(14);
        doc.setDrawColor(RULE.r, RULE.g, RULE.b);
        doc.line(M, y + 4, PW - M, y + 4);
        y += 14;
        continue;
      }
      if (b.type === "h1" || b.type === "h2" || b.type === "h3") {
        const size = b.type === "h1" ? 16 : b.type === "h2" ? 13 : 11;
        ensure(size + 10);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(size);
        doc.setTextColor(INK.r, INK.g, INK.b);
        const lines = doc.splitTextToSize(b.text, maxW);
        doc.text(lines, M, y + size);
        y += lines.length * (size + 4) + 6;
        continue;
      }
      if (b.type === "code") {
        doc.setFont("courier", "normal");
        doc.setFontSize(9);
        const lines = doc.splitTextToSize(b.text, maxW - 16);
        const blockH = lines.length * 12 + 12;
        ensure(blockH);
        doc.setFillColor(245, 247, 250);
        doc.setDrawColor(RULE.r, RULE.g, RULE.b);
        doc.roundedRect(M, y, maxW, blockH, 4, 4, "FD");
        doc.setTextColor(INK.r, INK.g, INK.b);
        doc.text(lines, M + 8, y + 14);
        y += blockH + 8;
        continue;
      }
      if (b.type === "quote") {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(11);
        doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
        const lines = doc.splitTextToSize(b.text, maxW - 16);
        const blockH = lines.length * 14 + 8;
        ensure(blockH);
        doc.setDrawColor(BRAND.r, BRAND.g, BRAND.b);
        doc.setLineWidth(2);
        doc.line(M + 2, y, M + 2, y + blockH - 4);
        doc.setLineWidth(0.5);
        doc.text(lines, M + 12, y + 12);
        y += blockH + 4;
        continue;
      }
      if (b.type === "li") {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(INK.r, INK.g, INK.b);
        const bullet = b.ordered ? `${b.n}.` : "•";
        const lines = doc.splitTextToSize(b.text, maxW - 22);
        const blockH = lines.length * 14 + 4;
        ensure(blockH);
        doc.setTextColor(BRAND.r, BRAND.g, BRAND.b);
        doc.text(bullet, M + 4, y + 12);
        doc.setTextColor(INK.r, INK.g, INK.b);
        doc.text(lines, M + 22, y + 12);
        y += blockH;
        continue;
      }
      // paragraph
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(INK.r, INK.g, INK.b);
      const lines = doc.splitTextToSize(b.text, maxW);
      const blockH = lines.length * 14 + 6;
      ensure(blockH);
      doc.text(lines, M, y + 12);
      y += blockH;
    }

    drawFooter();
    const fname = `vision-report-${Date.now()}.pdf`;
    doc.save(fname);
    toast.success("PDF report downloaded", { id: t });
  } catch (e) {
    console.error(e);
    toast.error("Failed to generate PDF", { id: t });
  }
}
