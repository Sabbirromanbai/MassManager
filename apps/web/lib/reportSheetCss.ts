/**
 * Plain, print-friendly styles for the member report sheet.
 *
 * Every color here is hex/rgb on purpose: html2canvas 1.4.1 cannot parse
 * modern color functions (oklch/lab) and Tailwind v4 emits them across the
 * app document, so the captured copy must not depend on any Tailwind rule.
 *
 * REPORT_SHEET_CSS is injected by the live sheet (screen + print).
 * REPORT_CAPTURE_CSS additionally carries a minimal preflight-style reset
 * and capture overrides, and is the ONLY stylesheet placed in the isolated
 * capture document used by lib/reportPdf.ts.
 */

/** Self-hosted Noto Sans Bengali (variable, OFL) so Bangla shapes identically
 *  on every device, including the rasterized PDF. */
const BENGALI_FONT_FACES = `
@font-face {
  font-family: "Noto Sans Bengali";
  font-style: normal;
  font-weight: 100 900;
  font-display: block;
  src: url("/fonts/noto-sans-bengali-bengali.woff2") format("woff2");
  unicode-range: U+0951-0952, U+0964-0965, U+0980-09FE, U+1CD0, U+1CD2, U+1CD5-1CD6, U+1CD8, U+1CE1, U+1CEA, U+1CED, U+1CF2, U+1CF5-1CF7, U+200C-200D, U+20B9, U+25CC, U+A8F1, U+11DF0-11DF1;
}
@font-face {
  font-family: "Noto Sans Bengali";
  font-style: normal;
  font-weight: 100 900;
  font-display: block;
  src: url("/fonts/noto-sans-bengali-latin-ext.woff2") format("woff2");
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
@font-face {
  font-family: "Noto Sans Bengali";
  font-style: normal;
  font-weight: 100 900;
  font-display: block;
  src: url("/fonts/noto-sans-bengali-latin.woff2") format("woff2");
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
`;

export const REPORT_SHEET_CSS = `
${BENGALI_FONT_FACES}

@page { size: A4; margin: 0; }

@media print {
  html, body { margin: 0; padding: 0; background: #fff !important; }
  /* The dashboard main has responsive padding; with @page margin 0 it would
     push a 210mm sheet off the right edge and add a blank trailing page. */
  main { margin: 0 !important; padding: 0 !important; }
  aside, nav, header, button, select { display: none !important; }
  .member-report-toolbar { display: none !important; }
  main > .pointer-events-none { display: none !important; }
  /* The base .mr-sheet rule below declares width: 100% later in this sheet. */
  .mr-sheet { width: 210mm !important; }
  body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
}

.mr-sheet {
  width: 100%;
  background: #fff;
  color: #111827;
  border-radius: 18px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.08);
  font-family: "Noto Sans Bengali", "Nirmala UI", "Bangla MN", "Lohit Bengali",
    system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  overflow: hidden;
}

.mr-header {
  display: flex;
  flex-direction: column;
  padding: 36px 42px 24px;
  background: linear-gradient(135deg, #064e3b 0%, #134e3f 55%, #1f7a5a 100%);
  color: #fff;
}

.mr-header-brand {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}

.mr-header-mark {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.24);
  display: flex;
  align-items: center;
  justify-content: center;
}

.mr-header-mark img { width: 26px; height: 26px; display: block; }

.mr-header-brand-name {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: linear-gradient(to right, #fff, #d1fae5);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.mr-header-kicker {
  font-size: 11px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.85);
}

.mr-header-title {
  font-size: 30px;
  font-weight: 800;
  line-height: 1.15;
  margin: 8px 0 4px;
  color: #fff;
}

.mr-header-subtitle {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
}

.mr-header-role {
  align-self: flex-start;
  margin-top: 12px;
  padding: 5px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.28);
  font-size: 12px;
  font-weight: 600;
}

.mr-body {
  padding: 22px 30px 30px;
}

.mr-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.mr-stat {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 15px 17px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.mr-stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 11px;
  margin-bottom: 11px;
}

.mr-stat-icon svg { width: 16px; height: 16px; }

.mr-stat-value { font-size: 21px; font-weight: 700; color: #111827; }
.mr-stat-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #6b7280;
  margin-top: 3px;
}

.mr-sections {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
  margin-top: 16px;
}

.mr-section {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 17px 18px;
}

.mr-section-title {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #6b7280;
  margin-bottom: 12px;
}

.mr-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 5px 0;
  border-bottom: 1px solid #e5e7eb;
  font-size: 13px;
}

.mr-row:last-child { border-bottom: none; }
.mr-row-label { color: #6b7280; min-width: 0; }
.mr-row-value { font-weight: 700; text-align: right; white-space: nowrap; }
.mr-row-value--danger { color: #b91c1c; }
.mr-row-value--emerald { color: #047857; }
.mr-row-value--faint { color: #9ca3af; }

.mr-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding: 14px 30px 20px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  font-size: 12px;
  color: #6b7280;
}
`;

/**
 * Stylesheet for the isolated capture document (hidden iframe). It contains
 * a small plain-CSS stand-in for the Tailwind preflight the live sheet relies
 * on (margin/border resets, block images, inherited heading weights), the
 * sheet rules themselves, and capture-only overrides. No oklch/lab anywhere.
 */
export const REPORT_CAPTURE_CSS = `
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  border: 0 solid #e5e7eb;
}
html { line-height: 1.5; -webkit-text-size-adjust: 100%; }
body { margin: 0; background: #ffffff; color: #111827; }
h1, h2, h3, h4, h5, h6 { font-size: inherit; font-weight: inherit; }
img, svg { display: block; vertical-align: middle; }
img { max-width: 100%; height: auto; }

${REPORT_SHEET_CSS}

/* Capture-only: match the print layout. */
.mr-sheet { width: 210mm; border-radius: 0; box-shadow: none; }

/* html2canvas cannot paint gradient-clipped text; keep the brand legible
   with a solid white fill in the captured copy only. */
.mr-header-brand-name {
  background: none;
  color: #ffffff;
  -webkit-text-fill-color: #ffffff;
}

/* html2canvas paints letter-spaced text grapheme-by-grapheme, which breaks
   Bengali conjunct shaping; drop tracking so whole words are shaped at once. */
.mr-sheet, .mr-sheet * { letter-spacing: 0 !important; }
`;
