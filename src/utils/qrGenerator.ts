import QRCode from 'qrcode';

export interface QrMatrixResult {
  size: number;
  modules: boolean[][];
  svgPath: string;
}

/**
 * Generates a real, scannable ISO/IEC 18004 QR Code matrix and crisp SVG path data.
 * Uses error correction level M (15%) for reliable smartphone scanning on printed A6 cards.
 */
export function generateQrMatrix(content: string): QrMatrixResult {
  const text = content.trim() || 'https://jemputjelasgubeng.example/?mode=penumpang';
  const qr = QRCode.create(text, { errorCorrectionLevel: 'M' });
  const size = qr.modules.size;
  const modules: boolean[][] = [];
  const pathParts: string[] = [];

  for (let row = 0; row < size; row += 1) {
    const rowArr: boolean[] = [];
    for (let col = 0; col < size; col += 1) {
      const dark = Boolean(qr.modules.get(row, col));
      rowArr.push(dark);
      if (dark) {
        // Draw each dark module as a crisp 1x1 unit square in SVG path coordinates
        pathParts.push(`M${col} ${row}h1v1h-1z`);
      }
    }
    modules.push(rowArr);
  }

  return {
    size,
    modules,
    svgPath: pathParts.join(''),
  };
}
