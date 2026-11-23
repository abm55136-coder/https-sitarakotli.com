import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rulesContent = fs.readFileSync(path.resolve(process.cwd(), 'firestore.rules'), 'utf8');
const blueprint = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'firebase-blueprint.json'), 'utf8'));

/**
 * Security Rules Audit & Dirty Dozen Invariant Verification Suite
 * Verifies every blueprint collection is covered and all 12 Dirty Dozen attack vectors are explicitly blocked.
 */
test('All collections in firebase-blueprint.json have explicit match blocks in firestore.rules', () => {
  const paths = Object.keys(blueprint.firestore || {});
  assert.ok(paths.length >= 16, 'Expected at least 16 Firestore collection paths in blueprint');
  for (const collectionPath of paths) {
    const cleanMatch = collectionPath.replace(/^\/users\/\{userId\}\//, '');
    assert.ok(
      rulesContent.includes(collectionPath) || rulesContent.includes(`match /${cleanMatch}`),
      `Missing match block for ${collectionPath}`
    );
  }
});

test('Dirty Dozen #1 & #2: Strict key allowlisting & self-assigned admin escalation prevention', () => {
  assert.ok(rulesContent.includes('data.keys().hasOnly(['), 'Schema blueprint must enforce strict hasOnly');
  assert.ok(rulesContent.includes("incoming().role == 'customer'"), 'User creation must forbid self-assigned admin role');
  assert.ok(rulesContent.includes('incoming().role == existing().role'), 'User self-update must freeze role');
});

test('Dirty Dozen #3: Email spoofing blocked via email_verified check', () => {
  assert.ok(rulesContent.includes('request.auth.token.email_verified == true'), 'Admin auth must verify email_verified');
  assert.ok(rulesContent.includes("request.auth.token.email == 'abm55136@gmail.com'"), 'Bootstrapped admin email configured');
});

test('Dirty Dozen #4 & #5 & #12: PII isolation & zero blanket list reads', () => {
  assert.ok(rulesContent.includes('match /private/{docId}'), 'Private PII subcollection isolated');
  assert.ok(!rulesContent.includes('allow list: if isSignedIn()'), 'Must not allow blanket list to any signed-in user');
  assert.ok(rulesContent.includes('match /newsletter/{subId}') && rulesContent.includes('allow list: if isBootstrappedAdmin()'), 'Newsletter PII restricted to admin list');
});

test('Dirty Dozen #6 & #7: Referential integrity via existsAfter for Khata and Purchases', () => {
  assert.ok(rulesContent.includes('existsAfter(/databases/$(database)/documents/khataAccounts/$(incoming().accountId))'));
  assert.ok(rulesContent.includes('existsAfter(/databases/$(database)/documents/suppliers/$(incoming().supplierId))'));
});

test('Dirty Dozen #8: Immutable activityLogs & backups updates', () => {
  const logBlock = rulesContent.slice(rulesContent.indexOf('match /activityLogs/{logId}'));
  assert.ok(logBlock.includes('allow update: if false;') && logBlock.includes('allow delete: if false;'));
  const backupBlock = rulesContent.slice(rulesContent.indexOf('match /backups/{backupId}'));
  assert.ok(backupBlock.includes('allow update: if false;'));
});

test('Dirty Dozen #9, #10, #11: ID poisoning guard, customerUid match, and server request.time timestamps', () => {
  assert.ok(rulesContent.includes("id.matches('^[a-zA-Z0-9_\\\\-]+$')"), 'ID regex guard present');
  assert.ok(rulesContent.includes('incoming().customerUid == request.auth.uid'), 'Order customerUid must match auth.uid');
  assert.ok(rulesContent.includes('data.createdAt == request.time'), 'Strict request.time check on createdAt');
  assert.ok(rulesContent.includes('data.updatedAt == request.time'), 'Strict request.time check on updatedAt');
});

test('Security Wall collections restrict PII/logs/IPs strictly to admins and keep securityLogs immutable', () => {
  for (const col of ['securityConfig', 'securityLogs', 'securityBlockedIps', 'securitySessions']) {
    assert.ok(rulesContent.includes(`match /${col}/{`), `Missing rule block for ${col}`);
  }
  const secLogBlock = rulesContent.slice(rulesContent.indexOf('match /securityLogs/{logId}'));
  assert.ok(secLogBlock.includes('allow update: if false;') && secLogBlock.includes('allow delete: if false;'));
  assert.ok(secLogBlock.includes('allow get: if isValidId(logId) && isAdmin();'));
  assert.ok(secLogBlock.includes('allow list: if isBootstrappedAdmin();'));
});

test('Global Business Upgrade: rules allow all 9 payment gateways, wholesale fields, and multi-currency orders', () => {
  for (const field of ['wholesalePrice', 'wholesaleMinQty', 'videoUrl']) {
    assert.ok(rulesContent.includes(`'${field}'`), `Product rule missing ${field}`);
    assert.ok(Boolean(blueprint.entities.Product.properties[field]), `Blueprint Product missing ${field}`);
  }
  for (const field of ['orderCurrency', 'exchangeRate', 'paymentStatus', 'paymentReference', 'courier', 'buyingMode']) {
    assert.ok(rulesContent.includes(`'${field}'`), `Order rule missing ${field}`);
    assert.ok(Boolean(blueprint.entities.Order.properties[field]), `Blueprint Order missing ${field}`);
  }
  for (const gateway of ['cod', 'easypaisa', 'jazzcash', 'bank_transfer', 'whatsapp', 'card', 'paypal', 'apple_pay', 'swift_wire']) {
    assert.ok(rulesContent.includes(`'${gateway}'`), `Order paymentMethod rule missing ${gateway}`);
  }
  for (const localeField of ['country', 'countryCode', 'timezone', 'preferredLanguage', 'preferredCurrency']) {
    assert.ok(rulesContent.includes(`'${localeField}'`), `UserPrivateInfo rule missing ${localeField}`);
  }
});
