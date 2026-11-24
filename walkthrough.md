# Security Summary

**Reviewed Files**: 22 (server entrypoint, security wall module, Firebase client/cloud sync modules, frontend components, config files, and environment templates)
**Issues Resolved**: 2

### Issues Resolved
| Area | File | Line | What Was Happening | Impact | Status | How It Was Fixed |
|---|---|---|---|---|---|---|
| Hardcoded Google API Key | `firebase-applet-config.json` | 4 | A literal Google/Firebase API key (`AIza...`) was stored in the tracked JSON configuration file, triggering GitHub Secret Scanning alerts. | High | Fixed / Needs Follow-Up | Removed the hardcoded key from `firebase-applet-config.json`, updated `src/firebase.ts` to read `import.meta.env.VITE_FIREBASE_API_KEY` with graceful offline fallback, and updated `server/securityWall.ts` to read `process.env.FIREBASE_WEB_API_KEY` / `VITE_FIREBASE_API_KEY` first. You should also revoke/rotate the exposed key in Google Cloud Console and add the new key to `.env.local` / Secrets. |
| Incomplete Explicit `.env` Ignore Rules | `.gitignore` | 7 | `.gitignore` relied only on `.env*` without explicitly listing `.env`, `.env.local`, and `.env*.local` and `.env.example` lacked Firebase key placeholders. | Medium | Fixed | Added explicit `.env`, `.env.local`, and `.env*.local` entries in `.gitignore` (preserving `!.env.example`) and updated `.env.example` with variable names only (`GEMINI_API_KEY`, `FIREBASE_WEB_API_KEY`, `VITE_FIREBASE_API_KEY`, `ADMIN_PASSCODE`, `RESEND_API_KEY`, `SECURITY_FROM_EMAIL`). |

### Safeguards Verified
| Area | File | How It's Protected |
|---|---|---|
| Gemini API Key Isolation | `server.ts` | Reads `process.env.GEMINI_API_KEY` exclusively on the Express backend (`createGeminiClient`). All AI calls (`/api/security/ai-analysis`, `/api/ai/security-analysis`, `/api/ai/business-insights`, `/api/ai/customer-support`, `/api/ai/translate`, `/api/ai/smart-search`) execute server-side; `@google/genai` and `GEMINI_API_KEY` never ship to the browser. |
| Firebase Config & Offline Resilience | `src/firebase.ts`, `src/services/cloudSync.ts`, `src/context/ShopContext.tsx` | Reads client Firebase configuration from `VITE_FIREBASE_API_KEY` (`import.meta.env`) and safely skips initialization (`isFirebaseConfigured = false`) rather than embedding keys in tracked JSON or crashing when unconfigured. |
| Server-Side Security Wall | `server/securityWall.ts` | Enforces WAF request inspection, sliding-window rate limiting, scrypt password hashing with `crypto.timingSafeEqual`, Email 2FA OTP verification, HMAC-SHA256 Bearer sessions, upload malware scanning, and security response headers (`X-Frame-Options`, CSP, `no-store` on `/api/*`). |
| Firestore Access Rules | `firestore.rules` | Protects ERP, Khata, orders, invoices, and security logs with admin verification, user ownership checks, and strict field validation. |

---

## PoC Verification

### 1. Eliminated Hardcoded `AIza...` Key Exposure in Source & Production Bundle

#### Summary
| Field | Value |
|---|---|
| Issue Type | Exposed Google API Key in Tracked Repository Config |
| Impact | High |
| Affected File | `firebase-applet-config.json:4`, `src/firebase.ts:13`, `server/securityWall.ts:81` |
| Test Scenario | Repository scan for `AIza`, `GEMINI_API_KEY`, and `VITE_GEMINI` across all source/config files and compiled `dist/` bundle, plus runtime boot with `VITE_FIREBASE_API_KEY` unset |

#### How It Was Fixed
Removed the literal `AIza...` string from `firebase-applet-config.json`, wired `src/firebase.ts` to read `import.meta.env.VITE_FIREBASE_API_KEY` with an `isFirebaseConfigured` guard (`db: Firestore | null`, `auth: Auth | null`), and updated `server/securityWall.ts` (`loadFirebaseWebApiKey`) to prefer `process.env.FIREBASE_WEB_API_KEY` and `process.env.VITE_FIREBASE_API_KEY`.

#### Step-by-Step Trace
| Step | What Happens in the Code | Outcome |
|---|---|---|
| 1 | Repository & built asset scan runs for `AIza`, `GEMINI_API_KEY`, and `@google/genai` | Zero `AIza` strings in repository or client bundle; `@google/genai` and `GEMINI_API_KEY` appear only in `server.ts` |
| 2 | App initializes in browser (`src/firebase.ts:13-32`) with `VITE_FIREBASE_API_KEY` unset | `isFirebaseConfigured` evaluates to `false`; Firebase SDK skips initialization cleanly without throwing `auth/invalid-api-key` |
| 3 | Client components (`src/services/cloudSync.ts`, `src/context/ShopContext.tsx`) check `db` / `auth` / `isFirebaseConfigured` | Listeners and writes degrade cleanly until the rotated key is supplied via environment variables |
| 4 | Server token verification (`server/securityWall.ts:81-91`) runs `loadFirebaseWebApiKey()` | Reads `process.env.FIREBASE_WEB_API_KEY` or `process.env.VITE_FIREBASE_API_KEY` from server environment without any hardcoded key |

#### Conclusion
**Fix Verified** - No Google or Gemini API keys remain hardcoded in source or tracked config files, Gemini remains strictly server-side via `process.env.GEMINI_API_KEY`, and the storefront operates cleanly without crashing when Firebase environment keys are rotated.
