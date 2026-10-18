// Reads the text inside a PDF on our own server, without calling Gemini.
// Most class PDFs (slides, typed notes, handouts) contain real text, so this is free and fast.
// Scanned or handwritten PDFs have little or no text: looksScanned() tells the caller
// to fall back to Gemini, which can read images.
//
// Uses pdfjs-dist (Mozilla's PDF reader). It's loaded lazily, so if it isn't installed yet
// readPdfText() throws and the caller simply uses Gemini instead.

export const MAX_PDF_PAGES = 300;

/**
 * @param {string} base64  the PDF file, base64-encoded
 * @returns {Promise<{ text: string, pages: number }>}
 */
export async function readPdfText(base64, { maxPages = MAX_PDF_PAGES } = {}) {
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const data = new Uint8Array(Buffer.from(base64, 'base64'));
  const task = getDocument({ data, isEvalSupported: false, verbosity: 0 });
  const doc = await task.promise;

  try {
    const pages = Math.min(doc.numPages, maxPages);
    const parts = [];
    for (let n = 1; n <= pages; n++) {
      const page = await doc.getPage(n);
      const content = await page.getTextContent();
      let line = '';
      const lines = [];
      for (const item of content.items) {
        if (typeof item.str !== 'string') continue;
        line += item.str;
        if (item.hasEOL) {
          lines.push(line);
          line = '';
        }
      }
      if (line) lines.push(line);
      parts.push(lines.map((l) => l.replace(/[ \t]+/g, ' ').trim()).filter(Boolean).join('\n'));
      page.cleanup();
    }
    return { text: parts.filter(Boolean).join('\n\n').trim(), pages };
  } finally {
    await task.destroy();
  }
}

/**
 * True if a PDF has too little text to make questions from, i.e. it's probably
 * scanned pages or images. Then Gemini should read it instead.
 */
export function looksScanned({ text, pages }) {
  const letters = (text ?? '').replace(/\s+/g, '').length;
  return letters < 200 || letters / Math.max(pages, 1) < 25;
}
