/**
 * Client-side PDF export of the member report.
 *
 * html2canvas 1.4.1 cannot parse modern CSS color functions (oklch/lab),
 * which Tailwind v4 emits across the whole app document — capturing the live
 * sheet in place fails with `unsupported color function "lab"`. Instead, the
 * sheet markup is re-rendered inside a hidden iframe whose only stylesheet is
 * the plain hex/rgb REPORT_CAPTURE_CSS, and that isolated document is
 * captured and wrapped into an A4 PDF. html2canvas/jsPDF are imported lazily
 * so they stay out of the initial dashboard bundle.
 *
 * Bangla text is rasterized by the browser itself (canvas fillText) with the
 * self-hosted Noto Sans Bengali font, so conjuncts and matras shape correctly.
 */

import { REPORT_CAPTURE_CSS } from "./reportSheetCss";

/** 210mm at 96dpi — the A4 sheet width used by the print layout. */
const A4_WIDTH_PX = 794;

function devLog(...args: unknown[]): void {
  if (process.env.NODE_ENV !== "production") {
    console.log("[report-pdf]", ...args);
  }
}

/** Warms the lazy PDF chunks before the user actually taps Share. */
export function warmReportPdf(): void {
  void Promise.all([import("html2canvas"), import("jspdf")]).catch(
    () => undefined
  );
}

/** Triggers a browser download for a generated PDF file. */
export function downloadReportPdf(file: File): void {
  const url = URL.createObjectURL(file);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Waits until the capture frame finished loading its inline document. */
async function waitForFrameLoad(iframe: HTMLIFrameElement): Promise<void> {
  const doc = iframe.contentDocument;
  if (!doc || doc.readyState === "complete") return;
  await new Promise<void>((resolve) => {
    const timer = window.setTimeout(resolve, 3000);
    iframe.addEventListener(
      "load",
      () => {
        window.clearTimeout(timer);
        resolve();
      },
      { once: true }
    );
  });
}

/**
 * Builds the isolated, Tailwind-free capture document from the live sheet's
 * markup and returns the rendered canvas.
 */
async function captureSheet(sheet: HTMLElement): Promise<HTMLCanvasElement> {
  const { default: html2canvas } = await import("html2canvas");

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.setAttribute("tabindex", "-1");
  iframe.style.cssText = `position:fixed;left:-10000px;top:0;width:${A4_WIDTH_PX}px;height:600px;border:0;background:#ffffff;`;
  document.body.appendChild(iframe);

  try {
    const doc = iframe.contentDocument;
    if (!doc) {
      throw new Error("Report capture frame could not be created");
    }
    const lang = document.documentElement.lang || "bn";
    doc.open();
    doc.write(
      `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><style>${REPORT_CAPTURE_CSS}</style></head><body>${sheet.outerHTML}</body></html>`
    );
    doc.close();
    await waitForFrameLoad(iframe);

    const captureSheetEl = doc.querySelector<HTMLElement>(".mr-sheet");
    if (!captureSheetEl) {
      throw new Error("Report sheet missing in capture frame");
    }

    // Inline SVG icons use stroke="currentColor"; html2canvas serializes them
    // as standalone images, so bake the inherited tone color onto each icon.
    captureSheetEl
      .querySelectorAll<SVGElement>(".mr-stat-icon svg")
      .forEach((svg) => {
        const parent = svg.parentElement;
        if (parent) {
          svg.style.color = doc.defaultView?.getComputedStyle(parent).color ?? "";
        }
      });

    // Wait for the logo and any other images (a missing logo must not fail
    // the whole export).
    await Promise.all(
      Array.from(doc.images).map((img) => img.decode().catch(() => undefined))
    );

    // Explicitly load the Bengali and Latin faces at the weights the sheet
    // uses, then wait for every pending font load before rasterizing.
    const sampleTexts = ["বাংলা ৳ ০১২৩", "Mess Manager 0123"];
    await Promise.all(
      ["400", "600", "700", "800"].flatMap((weight) =>
        sampleTexts.map((text) =>
          doc.fonts.load(`${weight} 16px "Noto Sans Bengali"`, text)
        )
      )
    );
    await doc.fonts.ready;

    // Size the frame to the full sheet so nothing is laid out clipped.
    iframe.style.height = `${Math.ceil(doc.documentElement.scrollHeight)}px`;

    devLog("capture start (isolated frame)", captureSheetEl.className);
    const canvas = await html2canvas(captureSheetEl, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
    });
    devLog("html2canvas capture done", canvas.width, canvas.height);
    return canvas;
  } finally {
    iframe.remove();
  }
}

export async function createReportPdfFile(
  sheet: HTMLElement,
  fileName: string
): Promise<File> {
  if (typeof document === "undefined") {
    throw new Error("PDF generation requires a browser");
  }

  const { jsPDF } = await import("jspdf");

  devLog("report pdf modules loaded");

  const canvas = await captureSheet(sheet).catch((error: unknown) => {
    devLog("html2canvas capture failed", error);
    throw error;
  });

  if (canvas.width === 0 || canvas.height === 0) {
    throw new Error("Report capture produced an empty image");
  }

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });
  devLog("jsPDF created");

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imageWidth = pageWidth;
  const imageHeight = (canvas.height * imageWidth) / canvas.width;
  const image = canvas.toDataURL("image/png");

  let remainingHeight = imageHeight;
  let verticalOffset = 0;
  pdf.addImage(image, "PNG", 0, verticalOffset, imageWidth, imageHeight);
  remainingHeight -= pageHeight;

  while (remainingHeight > 0) {
    verticalOffset -= pageHeight;
    pdf.addPage();
    pdf.addImage(image, "PNG", 0, verticalOffset, imageWidth, imageHeight);
    remainingHeight -= pageHeight;
  }

  const file = new File([pdf.output("blob")], fileName, {
    type: "application/pdf",
  });
  devLog("pdf file created", fileName, file.size);
  return file;
}
