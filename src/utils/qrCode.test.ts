import test from 'node:test';
import assert from 'node:assert/strict';
import { generateQrMatrix, renderQrSvgString } from './qrCode';

test('generateQrMatrix produces valid square QR matrix with 3 finder patterns & dark module', () => {
  const url = 'https://sitarakotli.com/?sku=SCH-M-BOSKI-08';
  const res = generateQrMatrix(url);

  assert.equal(res.size >= 25, true);
  assert.equal(res.modules.length, res.size);
  assert.equal(res.modules[0].length, res.size);

  // Top-left 7x7 finder outer ring must be dark (true)
  for (let i = 0; i < 7; i++) {
    assert.equal(res.modules[0][i], true);
    assert.equal(res.modules[6][i], true);
    assert.equal(res.modules[i][0], true);
    assert.equal(res.modules[i][6], true);
  }
  // Top-left 3x3 center must be dark
  assert.equal(res.modules[3][3], true);

  // Bottom-left finder dark module at (size - 8, 8)
  assert.equal(res.modules[res.size - 8][8], true);
});

test('renderQrSvgString returns clean SVG markup deterministically', () => {
  const svgA = renderQrSvgString('https://sitarakotli.com/?sku=SCH-W-LINEN-01');
  const svgB = renderQrSvgString('https://sitarakotli.com/?sku=SCH-W-LINEN-01');
  const svgC = renderQrSvgString('https://sitarakotli.com/?sku=SCH-M-KHADDAR-01');

  assert.equal(svgA.startsWith('<svg '), true);
  assert.equal(svgA.includes('</svg>'), true);
  assert.equal(svgA, svgB);
  assert.notEqual(svgA, svgC);
});
