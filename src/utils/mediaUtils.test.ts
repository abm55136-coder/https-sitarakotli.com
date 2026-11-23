import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatBytes,
  validateImageFile,
  rotateAngle,
  computeCroppedDimensions,
  filterMediaAssets,
} from './mediaUtils';
import { MediaAsset } from '../types';

test('formatBytes formats file sizes correctly', () => {
  assert.equal(formatBytes(0), '0 B');
  assert.equal(formatBytes(500), '500 B');
  assert.equal(formatBytes(2048), '2 KB');
  assert.equal(formatBytes(1024 * 1024 * 3.5), '3.5 MB');
});

test('validateImageFile accepts valid image types under 15MB', () => {
  const valid = validateImageFile({ type: 'image/jpeg', size: 1024 * 1024 * 2 });
  assert.equal(valid.valid, true);

  const invalidType = validateImageFile({ type: 'application/pdf', size: 1024 });
  assert.equal(invalidType.valid, false);

  const tooLarge = validateImageFile({ type: 'image/png', size: 1024 * 1024 * 20 });
  assert.equal(tooLarge.valid, false);
});

test('rotateAngle cycles correctly through 0, 90, 180, 270 degrees', () => {
  assert.equal(rotateAngle(0, 'cw'), 90);
  assert.equal(rotateAngle(90, 'cw'), 180);
  assert.equal(rotateAngle(270, 'cw'), 0);
  assert.equal(rotateAngle(0, 'ccw'), 270);
  assert.equal(rotateAngle(270, 'ccw'), 180);
});

test('computeCroppedDimensions centers and computes correct crop rectangle for ratios', () => {
  // 1:1 Square on 1920x1080
  const square = computeCroppedDimensions(1920, 1080, '1:1');
  assert.equal(square.width, 1080);
  assert.equal(square.height, 1080);
  assert.equal(square.x, 420);
  assert.equal(square.y, 0);

  // Free
  const free = computeCroppedDimensions(1920, 1080, 'free');
  assert.equal(free.width, 1920);
  assert.equal(free.height, 1080);
});

test('filterMediaAssets filters by category and search term', () => {
  const assets: MediaAsset[] = [
    {
      id: 'm1',
      title: 'Chinese Boski Silk',
      url: 'url1',
      category: 'fabrics',
      source: 'sample',
      uploadDate: '2026-11-01',
      tags: ['silk', 'boski'],
    },
    {
      id: 'm2',
      title: 'Prime Shop Khudadad Market Kotli',
      url: 'url2',
      category: 'property',
      source: 'gallery',
      uploadDate: '2026-11-02',
      tags: ['shop', 'commercial'],
    },
    {
      id: 'm3',
      title: 'Suzuki Bolan Van',
      url: 'url3',
      category: 'vehicles',
      source: 'camera',
      uploadDate: '2026-11-03',
      tags: ['van', 'delivery'],
    },
  ];

  const fabricsOnly = filterMediaAssets(assets, 'fabrics');
  assert.equal(fabricsOnly.length, 1);
  assert.equal(fabricsOnly[0].id, 'm1');

  const searchKotli = filterMediaAssets(assets, 'all', 'Kotli');
  assert.equal(searchKotli.length, 1);
  assert.equal(searchKotli[0].id, 'm2');

  const searchTag = filterMediaAssets(assets, 'all', 'delivery');
  assert.equal(searchTag.length, 1);
  assert.equal(searchTag[0].id, 'm3');
});
