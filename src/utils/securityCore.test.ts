import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSecurityAuditReportText,
  DEFAULT_SECURITY_CONFIG,
  detectPathTraversal,
  detectSqlInjection,
  detectXssPayload,
  evaluateBruteForceState,
  inspectValueForThreats,
  maskEmailAddress,
  scanFileUploadPayload,
  validateIpAddress,
  validateStrongPassword,
} from './securityCore';

test('WAF detects SQL injection payloads without false positives on luxury fabric descriptions', () => {
  assert.ok(detectSqlInjection("' OR '1'='1"));
  assert.ok(detectSqlInjection('1 UNION SELECT username, password FROM users'));
  assert.ok(detectSqlInjection("admin'; DROP TABLE invoices; --"));
  assert.equal(detectSqlInjection('Pure Royal Chinese Boski Silk 8-Pound 4.5m'), null);
  assert.equal(detectSqlInjection('Khudadad Market, Main Bazaar, Kotli'), null);
});

test('WAF detects XSS vectors and prototype pollution keys recursively', () => {
  assert.ok(detectXssPayload('<script>alert(document.cookie)</script>'));
  assert.ok(detectXssPayload('<img src=x onerror=fetch("https://evil.example")>'));
  assert.ok(detectXssPayload('javascript:alert(1)'));

  const nested = inspectValueForThreats({
    customer: { name: 'Ali', notes: '<iframe src="https://evil.com"></iframe>' },
  });
  assert.equal(nested.safe, false);
  assert.equal(nested.threatType, 'xss');

  const protoPayload = JSON.parse('{"__proto__": {"isAdmin": true}}');
  const protoResult = inspectValueForThreats(protoPayload);
  assert.equal(protoResult.safe, false);
  assert.equal(protoResult.threatType, 'prototype_pollution');

  const benign = inspectValueForThreats({
    title: 'ستارہ کلاٹھ ہاؤس بوسکی',
    price: 8500,
    colors: ['Cream', 'Ivory'],
  });
  assert.equal(benign.safe, true);
});

test('WAF detects directory traversal attempts', () => {
  assert.ok(detectPathTraversal('../../../../etc/passwd'));
  assert.ok(detectPathTraversal('%2e%2e%2fetc/shadow'));
  assert.equal(detectPathTraversal('/api/products/royal-boski-08'), null);
});

test('File upload malware scanner blocks executables, EICAR, double extensions, and XSS SVGs', () => {
  // Valid PNG header (89 50 4E 47 0D 0A 1A 0A)
  const validPngBase64 = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).toString('base64');
  const cleanPng = scanFileUploadPayload({
    fileName: 'boski-suit.png',
    mimeType: 'image/png',
    sizeBytes: 1024,
    base64Content: validPngBase64,
  });
  assert.equal(cleanPng.safe, true);

  // Disguised Windows MZ binary as .jpg
  const mzBase64 = Buffer.from([0x4d, 0x5a, 0x90, 0x00]).toString('base64');
  const disguisedExe = scanFileUploadPayload({
    fileName: 'invoice-photo.jpg',
    mimeType: 'image/jpeg',
    sizeBytes: 512,
    base64Content: mzBase64,
  });
  assert.equal(disguisedExe.safe, false);
  assert.equal(disguisedExe.severity, 'critical');

  // Double extension
  const doubleExt = scanFileUploadPayload({
    fileName: 'shell.php.jpg',
    mimeType: 'image/jpeg',
    sizeBytes: 256,
  });
  assert.equal(doubleExt.safe, false);

  // EICAR test string
  const eicarBase64 = Buffer.from(
    'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*'
  ).toString('base64');
  const eicarScan = scanFileUploadPayload({
    fileName: 'sample.json',
    mimeType: 'application/json',
    sizeBytes: 120,
    base64Content: eicarBase64,
  });
  assert.equal(eicarScan.safe, false);

  // SVG XSS
  const evilSvgBase64 = Buffer.from('<svg onload="alert(1)"><script>fetch(1)</script></svg>').toString('base64');
  const svgScan = scanFileUploadPayload({
    fileName: 'logo.svg',
    mimeType: 'image/svg+xml',
    sizeBytes: 200,
    base64Content: evilSvgBase64,
  });
  assert.equal(svgScan.safe, false);
});

test('IP validation, email masking, password strength, brute-force math, and report disclaimer', () => {
  assert.equal(validateIpAddress('192.168.1.45'), true);
  assert.equal(validateIpAddress('203.0.113.19'), true);
  assert.equal(validateIpAddress('999.10.1.1'), false);
  assert.equal(validateIpAddress('not-an-ip'), false);

  assert.equal(maskEmailAddress('abm55136@gmail.com'), 'ab******@gmail.com');

  assert.equal(validateStrongPassword('admin').valid, false);
  assert.equal(validateStrongPassword('Sitara@2026#Kotli').valid, true);

  const now = 1_700_000_000_000;
  const locked = evaluateBruteForceState(5, 5, now + 120_000, now);
  assert.equal(locked.isLocked, true);
  assert.equal(locked.remainingSeconds, 120);

  const report = buildSecurityAuditReportText({
    config: DEFAULT_SECURITY_CONFIG,
    blockedIps: [],
    events: [],
    sessions: [],
  });
  assert.ok(report.includes('no security system guarantees 100% immunity'));
});
