# Sitara Cloth House Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Identity & Privilege Invariant**: Only Google-authenticated users with `email_verified == true` and either bootstrapped owner email `abm55136@gmail.com` or an `/admins/{uid}` document can administer the ERP database. Users registering under `/users/{uid}` cannot self-assign `role: "admin"`.
2. **PII Isolation**: Customer PII (`email`, `phone`, `address`) is isolated inside `/users/{userId}/private/{docId}` or private ERP collections (`/orders`, `/khataAccounts`, `/invoices`, `/suppliers`, `/staff`, `/newsletter`). Public catalog collections (`/products`, `/banners`, `/reviews`, `/config`) contain zero personal customer PII.
3. **Referential Integrity**:
   - Every `/khataTransactions/{txId}` MUST reference an existing or same-batch `/khataAccounts/{accountId}`.
   - Every `/purchases/{purchaseId}` MUST reference an existing or same-batch `/suppliers/{supplierId}`.
4. **Temporal & Immutability Integrity**:
   - `createdAt` and `updatedAt` timestamps on protected writes must equal `request.time`.
   - `createdAt`, `customerUid`, and `actorUid` are immutable after document creation.
   - `/activityLogs/{logId}` records are append-only (`update: false, delete: false`).
   - `/backups/{backupId}` records are immutable snapshots (`update: false`).
5. **Path & Bounded Array Guarding**: All document IDs match `^[a-zA-Z0-9_\-]+$` (<= 128 chars). String fields have strict `.size()` upper bounds, and all list fields (`items`, `colors`, `additionalImages`) are strictly bounded (`size() <= 50`).
6. **Zero-Trust Query Enforcement**: `allow list` never uses blanket `isSignedIn()` and never triggers `get()`/`exists()` O(n) query amplification.

## 2. The "Dirty Dozen" Adversarial Test Payloads
All 12 payloads below MUST fail with `PERMISSION_DENIED`:
1. **Shadow/Ghost Field on Product Create**: `{ "sku": "S-1", "title": "Boski", "gender": "men", "category": "boski", "price": 5000, "image": "https://img", "stockQuantity": 5, "ghostAdminFlag": true }` by non-admin or admin.
2. **Self-Assigned Admin Escalation on `/users/{uid}`**: `{ "uid": "user1", "displayName": "Attacker", "role": "admin", "createdAt": "SERVER_TIME", "updatedAt": "SERVER_TIME" }`.
3. **Unverified Email Spoofing Admin**: Token with `email: "abm55136@gmail.com"` and `email_verified: false` attempting to list `/khataAccounts`.
4. **Cross-Tenant PII Snooping**: Authenticated customer `user2` calling `get` on `/users/user1/private/info`.
5. **Blanket Order List Scraping**: Authenticated customer `user2` calling `list` on `/orders` without `where('customerUid', '==', 'user2')`.
6. **Orphaned Khata Transaction**: Writing `/khataTransactions/tx1` referencing non-existent `accountId: "nonexistent-cust"`.
7. **Orphaned Purchase Record**: Writing `/purchases/pur1` referencing non-existent `supplierId: "nonexistent-sup"`.
8. **Mutating Immutable Audit Log**: Calling `update` or `delete` on `/activityLogs/log1` even by an admin.
9. **ID Poisoning (>128 chars / illegal chars)**: Creating `/products/..%2Fhacked` or 200-char ID.
10. **Forged Order Customer UID**: Customer `user2` creating `/orders/ord99` with `customerUid: "user1"`.
11. **Backdated Timestamp Spoofing**: Creating `/reviews/rev99` with `createdAt` set to a client-chosen past date instead of `request.time`.
12. **Public Reading Newsletter PII**: Unauthenticated or non-admin customer reading/listing `/newsletter`.
