// Helpers for reading files the player picks, before sending them to the server.

export const MAX_PDF_BYTES = 15 * 1024 * 1024; // must match the server limit (server/src/services/studyPacks.js)

/** True for PDFs (some browsers leave file.type empty, so also check the extension). */
export function isPdfFile(file) {
  return file?.type === 'application/pdf' || /\.pdf$/i.test(file?.name ?? '');
}

/** File name without its extension, e.g. "Bio Ch 3.pdf" -> "Bio Ch 3". Used as a default title. */
export function titleFromFileName(name = '') {
  return name.replace(/\.[^.]+$/, '');
}

/** Read a File as base64 text (the format POST /api/notes expects for PDFs). */
export function readAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]); // drop "data:...;base64,"
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
