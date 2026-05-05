import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "sonner";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { preprocessLatex } from "./latex-utils";
import type { Message } from "./types";

type Opts = {
  title?: string;
  model?: string;
  prompt?: string;
  images: string[];
  analysis: string;
};

// ---- helpers ----

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function imageToDataUrl(src: string): Promise<string> {
  if (src.startsWith("data:image/")) return src;
  try {
    const img = await loadImage(src);
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.getContext("2d")!.drawImage(img, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.92);
  } catch {
    return src;
  }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

function markdownToHtml(md: string): string {
  const node = createElement(ReactMarkdown as any, {
    remarkPlugins: [remarkGfm, remarkMath],
    rehypePlugins: [rehypeKatex],
    children: preprocessLatex(md || ""),
  });
  return renderToStaticMarkup(node as any);
}

// Inline a tiny subset of katex CSS via the app's already-loaded stylesheet.
// We rely on document fonts; html2canvas captures computed styles.

const PDF_CSS = `
  *,*::before,*::after{box-sizing:border-box}
  .pdf-root{
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color:#161b22; background:#ffffff; padding:36px 44px; width:794px;
    line-height:1.55; font-size:13px;
  }
  .pdf-root h1{font-size:26px;margin:0 0 6px;color:#0b1220;font-weight:800;letter-spacing:-.01em}
  .pdf-root h2{font-size:18px;margin:18px 0 8px;color:#00788a;font-weight:700}
  .pdf-root h3{font-size:15px;margin:14px 0 6px;color:#0b1220;font-weight:700}
  .pdf-root p{margin:6px 0}
  .pdf-root ul,.pdf-root ol{margin:6px 0 6px 22px;padding:0}
  .pdf-root li{margin:3px 0}
  .pdf-root code{background:#f3f5f8;border:1px solid #e3e8ef;border-radius:4px;padding:1px 5px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;color:#0b1220}
  .pdf-root pre{background:#0f172a;color:#e6edf3;border-radius:8px;padding:12px 14px;overflow:hidden;white-space:pre-wrap;word-break:break-word;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;margin:8px 0}
  .pdf-root pre code{background:transparent;border:0;color:inherit;padding:0}
  .pdf-root blockquote{border-left:3px solid #00bcd4;background:#f0fbfd;color:#334155;margin:8px 0;padding:8px 12px;border-radius:4px}
  .pdf-root hr{border:0;border-top:1px solid #e2e8f0;margin:14px 0}
  .pdf-root a{color:#0e7c8a;text-decoration:underline}
  .pdf-root table{border-collapse:collapse;width:100%;margin:10px 0;font-size:12px;table-layout:auto}
  .pdf-root th,.pdf-root td{border:1px solid #d8dee6;padding:6px 9px;text-align:left;vertical-align:top}
  .pdf-root thead th{background:#eef6f8;color:#0b1220;font-weight:700}
  .pdf-root tbody tr:nth-child(even){background:#f8fafc}
  .pdf-root img{max-width:100%;border-radius:6px;border:1px solid #e2e8f0}
  /* KaTeX */
  .pdf-root .katex{font-size:1.05em;color:#0b1220}
  .pdf-root .katex-display{margin:10px 0;padding:10px 14px;background:#f6fbfd;border:1px solid #d6eef3;border-radius:8px;text-align:center;overflow-x:hidden}
  .pdf-root .katex-display>.katex{font-size:1.15em}
  /* Layout chrome */
  .pdf-header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #00bcd4;padding-bottom:8px;margin-bottom:14px;font-size:11px;color:#475569}
  .pdf-brand{font-weight:700;color:#0b1220;letter-spacing:.02em}
  .pdf-meta{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px 14px;margin-bottom:14px;font-size:12px}
  .pdf-meta .k{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#64748b;margin-bottom:2px}
  .pdf-meta .v{color:#0b1220;font-weight:600}
  .pdf-prompt{margin-top:8px;font-size:12px;color:#475569;font-style:italic;grid-column:1/-1}
  .pdf-section-title{font-size:14px;font-weight:700;color:#00788a;text-transform:uppercase;letter-spacing:.08em;margin:18px 0 8px;border-bottom:1px solid #e2e8f0;padding-bottom:4px}
  .pdf-gallery{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:6px}
  .pdf-gallery figure{margin:0;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;background:#fff}
  .pdf-gallery figcaption{font-size:10px;color:#64748b;padding:4px 8px;background:#f8fafc;border-top:1px solid #eef2f6}
  .pdf-gallery img{display:block;width:100%;height:auto;border:0;border-radius:0}
  .pdf-msg{border:1px solid #e2e8f0;border-radius:10px;margin:10px 0;overflow:hidden}
  .pdf-msg .pdf-msg-h{display:flex;justify-content:space-between;padding:8px 12px;font-size:11px;font-weight:700}
  .pdf-msg.user .pdf-msg-h{background:#eaf6fb;color:#0b6e80}
  .pdf-msg.assistant .pdf-msg-h{background:#f3eefb;color:#5b3aa8}
  .pdf-msg .pdf-msg-b{padding:10px 14px}
`;

async function inlineImagesInHtml(html: string): Promise<string> {
  const matches = Array.from(html.matchAll(/<img[^>]+src="([^"]+)"/g));
  let out = html;
  for (const m of matches) {
    const src = m[1];
    if (src.startsWith("data:")) continue;
    try {
      const data = await imageToDataUrl(src);
      out = out.split(src).join(data);
    } catch { /* ignore */ }
  }
  return out;
}

function ensureKatexCss(): Promise<void> {
  return new Promise((resolve) => {
    if (document.querySelector('link[data-katex-pdf]')) return resolve();
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css";
    link.setAttribute("data-katex-pdf", "true");
    link.onload = () => resolve();
    link.onerror = () => resolve();
    document.head.appendChild(link);
  });
}

async function htmlToPdf(innerHtml: string, fname: string) {
  await ensureKatexCss();
  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "-10000px";
  host.style.top = "0";
  host.style.zIndex = "-1";
  host.innerHTML = `<style>${PDF_CSS}</style><div class="pdf-root">${innerHtml}</div>`;
  document.body.appendChild(host);
  // wait a tick for fonts/css to apply
  await new Promise(r => setTimeout(r, 60));
  try {
    const root = host.querySelector(".pdf-root") as HTMLElement;
    const canvas = await html2canvas(root, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
      windowWidth: root.scrollWidth,
    });
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const PW = doc.internal.pageSize.getWidth();
    const PH = doc.internal.pageSize.getHeight();
    const margin = 24;
    const imgW = PW - margin * 2;
    const ratio = imgW / canvas.width;
    const imgH = canvas.height * ratio;
    const pageContentH = PH - margin * 2;

    if (imgH <= pageContentH) {
      doc.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", margin, margin, imgW, imgH, undefined, "FAST");
    } else {
      // slice the canvas vertically into page-sized chunks
      const sliceCanvasH = Math.floor(pageContentH / ratio);
      let offsetY = 0;
      let page = 0;
      while (offsetY < canvas.height) {
        const sliceH = Math.min(sliceCanvasH, canvas.height - offsetY);
        const slice = document.createElement("canvas");
        slice.width = canvas.width;
        slice.height = sliceH;
        slice.getContext("2d")!.drawImage(canvas, 0, offsetY, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
        if (page > 0) doc.addPage();
        doc.addImage(slice.toDataURL("image/jpeg", 0.95), "JPEG", margin, margin, imgW, sliceH * ratio, undefined, "FAST");
        // page number footer
        doc.setFontSize(9); doc.setTextColor(120);
        doc.text(`Page ${page + 1}`, PW / 2, PH - 10, { align: "center" });
        offsetY += sliceH;
        page += 1;
      }
    }

    await deliverPdf(doc, fname);
  } finally {
    document.body.removeChild(host);
  }
}

async function deliverPdf(doc: jsPDF, fname: string) {
  if (Capacitor.isNativePlatform()) {
    const dataUri = doc.output("datauristring");
    const base64 = dataUri.substring(dataUri.indexOf("base64,") + 7);
    const res = await Filesystem.writeFile({ path: fname, data: base64, directory: Directory.Documents });
    try {
      await Share.share({ title: "MegaKUMUL Report", text: "AI analysis report", url: res.uri, dialogTitle: "Share / Save PDF" });
    } catch { /* cancelled */ }
    return;
  }
  doc.save(fname);
}

// ---- Vision report ----

export async function exportVisionPDF({ title, model, prompt, images, analysis }: Opts) {
  const t = toast.loading("Generating PDF report…");
  try {
    const dataImgs = await Promise.all(images.map(imageToDataUrl));
    const galleryHtml = dataImgs.length
      ? `<div class="pdf-section-title">Analyzed Images</div>
         <div class="pdf-gallery">${dataImgs.map((d, i) => `<figure><img src="${d}" alt="image ${i + 1}" /><figcaption>Image ${i + 1}</figcaption></figure>`).join("")}</div>`
      : "";
    const analysisHtml = await inlineImagesInHtml(markdownToHtml(analysis || "_No analysis available._"));
    const innerHtml = `
      <div class="pdf-header">
        <div class="pdf-brand">MegaKUMUL · Vision Analysis Report</div>
        <div>${escapeHtml(new Date().toLocaleString())}</div>
      </div>
      <h1>${escapeHtml(title || "AI Image Analysis Report")}</h1>
      <div class="pdf-meta">
        <div><div class="k">Model</div><div class="v">${escapeHtml(model || "auto")}</div></div>
        <div><div class="k">Images</div><div class="v">${dataImgs.length}</div></div>
        <div><div class="k">Generated</div><div class="v">${escapeHtml(new Date().toLocaleString())}</div></div>
        ${prompt ? `<div class="pdf-prompt">Prompt: ${escapeHtml(prompt)}</div>` : ""}
      </div>
      ${galleryHtml}
      <div class="pdf-section-title">Detailed Analysis</div>
      <div>${analysisHtml}</div>
    `;
    await htmlToPdf(innerHtml, `vision-report-${Date.now()}.pdf`);
    toast.success("PDF report ready", { id: t });
  } catch (e) {
    console.error(e);
    toast.error("Failed to generate PDF", { id: t });
  }
}

// ---- Conversation transcript ----

export async function exportConversationPDF(opts: { title: string; messages: Message[]; model?: string }) {
  const { title, messages, model } = opts;
  const t = toast.loading("Generating conversation PDF…");
  try {
    const parts: string[] = [];
    parts.push(`
      <div class="pdf-header">
        <div class="pdf-brand">MegaKUMUL · Conversation Transcript</div>
        <div>${escapeHtml(new Date().toLocaleString())}</div>
      </div>
      <h1>${escapeHtml(title || "Conversation")}</h1>
      <div class="pdf-meta">
        <div><div class="k">Messages</div><div class="v">${messages.length}</div></div>
        <div><div class="k">Model</div><div class="v">${escapeHtml(model || "auto")}</div></div>
        <div><div class="k">Exported</div><div class="v">${escapeHtml(new Date().toLocaleString())}</div></div>
      </div>
    `);

    for (const msg of messages) {
      const isUser = msg.role === "user";
      const imgs = msg.imageUrls ?? (msg.imageUrl ? [msg.imageUrl] : []);
      const dataImgs = await Promise.all(imgs.map(imageToDataUrl));
      const imgHtml = dataImgs.length
        ? `<div class="pdf-gallery">${dataImgs.map((d, i) => `<figure><img src="${d}" alt="image ${i + 1}"/><figcaption>Attachment ${i + 1}</figcaption></figure>`).join("")}</div>`
        : "";
      const bodyHtml = await inlineImagesInHtml(markdownToHtml(msg.content || ""));
      const ts = msg.timestamp ? new Date(msg.timestamp).toLocaleString() : "";
      parts.push(`
        <div class="pdf-msg ${isUser ? "user" : "assistant"}">
          <div class="pdf-msg-h"><span>${isUser ? "You" : "MegaKUMUL"}${msg.model ? ` · ${escapeHtml(msg.model)}` : ""}</span><span>${escapeHtml(ts)}</span></div>
          <div class="pdf-msg-b">${imgHtml}${bodyHtml}</div>
        </div>
      `);
    }

    await htmlToPdf(parts.join("\n"), `${(title || "conversation").replace(/[^\w-]+/g, "-").slice(0, 50)}-${Date.now()}.pdf`);
    toast.success("Conversation PDF ready", { id: t });
  } catch (e) {
    console.error(e);
    toast.error("Failed to export PDF", { id: t });
  }
}
