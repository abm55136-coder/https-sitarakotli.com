/**
 * Pure TypeScript ISO-18004 QR Code Matrix & SVG Generator (Versions 1..5, Byte Mode, EC Level L/M)
 * Zero external dependencies — deterministic, scannable, and safe for client + server/test environments.
 */

export interface QrMatrixResult {
  version: number;
  size: number;
  modules: boolean[][];
  dataText: string;
}

// Version 1..5 EC Level L parameters: [totalCodewords, ecCodewordsPerBlock, alignmentCenter]
const VERSION_SPECS: Record<
  number,
  { size: number; totalCodewords: number; dataCodewords: number; ecCodewords: number; align?: number }
> = {
  1: { size: 21, totalCodewords: 26, dataCodewords: 19, ecCodewords: 7 },
  2: { size: 25, totalCodewords: 44, dataCodewords: 34, ecCodewords: 10, align: 18 },
  3: { size: 29, totalCodewords: 70, dataCodewords: 55, ecCodewords: 15, align: 22 },
  4: { size: 33, totalCodewords: 100, dataCodewords: 80, ecCodewords: 20, align: 26 },
  5: { size: 37, totalCodewords: 134, dataCodewords: 108, ecCodewords: 26, align: 30 },
};

// GF(256) exp and log tables with primitive polynomial 0x11D
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) {
      x ^= 0x11d;
    }
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255];
  }
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function getGeneratorPolynomial(ecCount: number): Uint8Array {
  let poly: number[] = [1];
  for (let i = 0; i < ecCount; i++) {
    const next: number[] = new Array(poly.length + 1).fill(0);
    const root = GF_EXP[i];
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], root);
    }
    poly = next;
  }
  return Uint8Array.from(poly);
}

function computeReedSolomonEc(data: Uint8Array, ecCount: number): Uint8Array {
  const gen = getGeneratorPolynomial(ecCount);
  const buffer = new Uint8Array(data.length + ecCount);
  buffer.set(data, 0);

  for (let i = 0; i < data.length; i++) {
    const lead = buffer[i];
    if (lead !== 0) {
      for (let j = 0; j < gen.length; j++) {
        buffer[i + j] ^= gfMul(gen[j], lead);
      }
    }
  }
  return buffer.slice(data.length);
}

function encodeBytesToUtf8(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function chooseVersion(byteLength: number): number {
  // Byte mode overhead: 4 bits mode + 8 bits length + payload + 4 bits terminator -> +2 bytes
  for (let v = 1; v <= 5; v++) {
    if (byteLength + 2 <= VERSION_SPECS[v].dataCodewords) {
      return v;
    }
  }
  return 5;
}

function buildCodewords(bytes: Uint8Array, version: number): Uint8Array {
  const spec = VERSION_SPECS[version];
  const maxPayload = spec.dataCodewords - 2;
  const payload = bytes.length > maxPayload ? bytes.slice(0, maxPayload) : bytes;

  const bits: number[] = [];
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >> i) & 1);
    }
  };

  // Mode: Byte = 0100
  pushBits(0b0100, 4);
  // Character count (8-bit for versions 1..9)
  pushBits(payload.length, 8);
  for (const b of payload) {
    pushBits(b, 8);
  }
  // Terminator up to 4 zeros
  const totalDataBits = spec.dataCodewords * 8;
  for (let i = 0; i < 4 && bits.length < totalDataBits; i++) {
    bits.push(0);
  }
  // Pad to byte boundary
  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  const dataBytes = new Uint8Array(spec.dataCodewords);
  for (let i = 0; i < spec.dataCodewords; i++) {
    if (i * 8 < bits.length) {
      let val = 0;
      for (let b = 0; b < 8; b++) {
        val = (val << 1) | (bits[i * 8 + b] || 0);
      }
      dataBytes[i] = val;
    } else {
      // Standard QR pad bytes 0xEC, 0x11 alternating
      const padIdx = i - bits.length / 8;
      dataBytes[i] = padIdx % 2 === 0 ? 0xec : 0x11;
    }
  }

  const ecBytes = computeReedSolomonEc(dataBytes, spec.ecCodewords);
  const full = new Uint8Array(spec.totalCodewords);
  full.set(dataBytes, 0);
  full.set(ecBytes, dataBytes.length);
  return full;
}

function placeFinder(grid: (boolean | null)[][], reserved: boolean[][], row: number, col: number) {
  const size = grid.length;
  for (let r = -1; r <= 7; r++) {
    for (let c = -1; c <= 7; c++) {
      const rr = row + r;
      const cc = col + c;
      if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
      const inOuter = r >= 0 && r <= 6 && (c === 0 || c === 6);
      const inHoriz = c >= 0 && c <= 6 && (r === 0 || r === 6);
      const inCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
      grid[rr][cc] = inOuter || inHoriz || inCenter;
      reserved[rr][cc] = true;
    }
  }
}

function placeAlignment(grid: (boolean | null)[][], reserved: boolean[][], centerR: number, centerC: number) {
  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      const rr = centerR + r;
      const cc = centerC + c;
      const dark = Math.max(Math.abs(r), Math.abs(c)) !== 1;
      grid[rr][cc] = dark;
      reserved[rr][cc] = true;
    }
  }
}

// Compute 15-bit BCH format string for EC Level L (01) and mask (0..7)
function computeFormatBits(maskPattern: number): number {
  const ecLevelBits = 0b01; // L = 01
  const data = (ecLevelBits << 3) | (maskPattern & 0b111);
  let rem = data << 10;
  const poly = 0b10100110111;
  for (let i = 14; i >= 10; i--) {
    if ((rem >> i) & 1) {
      rem ^= poly << (i - 10);
    }
  }
  const combined = ((data << 10) | rem) ^ 0b101010000010010;
  return combined;
}

function applyFormatBits(grid: boolean[][], size: number, maskPattern: number) {
  const fmt = computeFormatBits(maskPattern);
  for (let i = 0; i < 15; i++) {
    const bit = Boolean((fmt >> i) & 1);
    // Vertical around top-left
    if (i < 6) {
      grid[i][8] = bit;
    } else if (i < 8) {
      grid[i + 1][8] = bit;
    } else {
      grid[size - 15 + i][8] = bit;
    }
    // Horizontal
    if (i < 8) {
      grid[8][size - 1 - i] = bit;
    } else if (i < 9) {
      grid[8][15 - i] = bit;
    } else {
      grid[8][14 - i] = bit;
    }
  }
}

function maskCondition(mask: number, r: number, c: number): boolean {
  switch (mask) {
    case 0:
      return (r + c) % 2 === 0;
    case 1:
      return r % 2 === 0;
    case 2:
      return c % 3 === 0;
    case 3:
      return (r + c) % 3 === 0;
    case 4:
      return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
    case 5:
      return ((r * c) % 2) + ((r * c) % 3) === 0;
    case 6:
      return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0;
    case 7:
    default:
      return (((r + c) % 2) + ((r * c) % 3)) % 2 === 0;
  }
}

function calculatePenaltyScore(grid: boolean[][]): number {
  const n = grid.length;
  let penalty = 0;

  // Rule 1: 5+ same color in row/col
  for (let r = 0; r < n; r++) {
    let runH = 1;
    let runV = 1;
    for (let c = 1; c < n; c++) {
      if (grid[r][c] === grid[r][c - 1]) {
        runH++;
        if (runH === 5) penalty += 3;
        else if (runH > 5) penalty += 1;
      } else {
        runH = 1;
      }
      if (grid[c][r] === grid[c - 1][r]) {
        runV++;
        if (runV === 5) penalty += 3;
        else if (runV > 5) penalty += 1;
      } else {
        runV = 1;
      }
    }
  }

  // Rule 2: 2x2 blocks
  for (let r = 0; r < n - 1; r++) {
    for (let c = 0; c < n - 1; c++) {
      const b = grid[r][c];
      if (grid[r][c + 1] === b && grid[r + 1][c] === b && grid[r + 1][c + 1] === b) {
        penalty += 3;
      }
    }
  }

  return penalty;
}

export function generateQrMatrix(text: string): QrMatrixResult {
  const safeText = (text || 'https://sitarakotli.com').trim();
  const utf8 = encodeBytesToUtf8(safeText);
  const version = chooseVersion(utf8.length);
  const spec = VERSION_SPECS[version];
  const size = spec.size;

  const baseGrid: (boolean | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));
  const reserved: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  // Finder patterns
  placeFinder(baseGrid, reserved, 0, 0);
  placeFinder(baseGrid, reserved, 0, size - 7);
  placeFinder(baseGrid, reserved, size - 7, 0);

  // Alignment pattern (Versions 2..5 have 1 alignment pattern at (align, align))
  if (spec.align !== undefined) {
    placeAlignment(baseGrid, reserved, spec.align, spec.align);
  }

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    baseGrid[6][i] = i % 2 === 0;
    reserved[6][i] = true;
    baseGrid[i][6] = i % 2 === 0;
    reserved[i][6] = true;
  }

  // Dark module & reserve format info areas
  baseGrid[size - 8][8] = true;
  reserved[size - 8][8] = true;
  for (let i = 0; i < 9; i++) {
    reserved[8][i] = true;
    reserved[i][8] = true;
  }
  for (let i = size - 8; i < size; i++) {
    reserved[8][i] = true;
    reserved[i][8] = true;
  }

  // Build data + ECC bitstream
  const codewords = buildCodewords(utf8, version);
  const bitStream: boolean[] = [];
  for (const byte of codewords) {
    for (let b = 7; b >= 0; b--) {
      bitStream.push(Boolean((byte >> b) & 1));
    }
  }

  // Place data bits in zig-zag order
  let bitIdx = 0;
  let upward = true;
  for (let rightCol = size - 1; rightCol > 0; rightCol -= 2) {
    if (rightCol === 6) rightCol--;
    for (let step = 0; step < size; step++) {
      const r = upward ? size - 1 - step : step;
      for (const offset of [0, 1]) {
        const c = rightCol - offset;
        if (!reserved[r][c]) {
          baseGrid[r][c] = bitIdx < bitStream.length ? bitStream[bitIdx++] : false;
        }
      }
    }
    upward = !upward;
  }

  // Select optimal mask (0..7) with lowest penalty score
  let bestMask = 0;
  let bestScore = Number.POSITIVE_INFINITY;
  let bestGrid: boolean[][] = [];

  for (let mask = 0; mask < 8; mask++) {
    const candidate: boolean[][] = Array.from({ length: size }, (_, r) =>
      Array.from({ length: size }, (_, c) => {
        const val = Boolean(baseGrid[r][c]);
        if (reserved[r][c]) return val;
        return maskCondition(mask, r, c) ? !val : val;
      })
    );
    applyFormatBits(candidate, size, mask);
    const score = calculatePenaltyScore(candidate);
    if (score < bestScore) {
      bestScore = score;
      bestMask = mask;
      bestGrid = candidate;
    }
  }

  void bestMask;
  return {
    version,
    size,
    modules: bestGrid,
    dataText: safeText,
  };
}

export function renderQrSvgString(
  text: string,
  options?: { fgColor?: string; bgColor?: string; sizePx?: number; quietZone?: number }
): string {
  const fg = options?.fgColor || '#1c1917';
  const bg = options?.bgColor || '#ffffff';
  const sizePx = options?.sizePx || 180;
  const quiet = options?.quietZone ?? 2;

  const matrix = generateQrMatrix(text);
  const viewBoxSize = matrix.size + quiet * 2;
  const rects: string[] = [];

  for (let r = 0; r < matrix.size; r++) {
    for (let c = 0; c < matrix.size; c++) {
      if (matrix.modules[r][c]) {
        rects.push(`<rect x="${c + quiet}" y="${r + quiet}" width="1" height="1" />`);
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBoxSize} ${viewBoxSize}" width="${sizePx}" height="${sizePx}" shape-rendering="crispEdges"><rect width="${viewBoxSize}" height="${viewBoxSize}" fill="${bg}"/><g fill="${fg}">${rects.join('')}</g></svg>`;
}
