import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { SecurityWallEngine } from './server/securityWall';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const PORT =
  process.env.NGINX_PORT && process.env.PORT === process.env.NGINX_PORT
    ? Number(process.env.DEFAULT_APP_PORT) || 3000
    : isProduction
    ? Number(process.env.PORT) || 3000
    : 3000;

function createGeminiClient(timeoutMs = 25000) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      timeout: timeoutMs,
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function isTransientDemandOrTimeoutError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err || '');
  return (
    msg.includes('503') ||
    msg.includes('504') ||
    msg.includes('500') ||
    msg.includes('UNAVAILABLE') ||
    msg.includes('DEADLINE_EXCEEDED') ||
    msg.includes('INTERNAL') ||
    msg.includes('high demand') ||
    msg.includes('429') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.toLowerCase().includes('timeout') ||
    msg.toLowerCase().includes('deadline') ||
    msg.toLowerCase().includes('aborted')
  );
}

async function generateWithResilientModel(
  ai: GoogleGenAI,
  params: {
    contents: string;
    config: Record<string, unknown>;
  }
) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: params.contents,
      config: {
        ...params.config,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW,
        },
      },
    });
    return { response, usedModel: 'gemini-4-hydrogen' };
  } catch (primaryErr) {
    if (!isTransientDemandOrTimeoutError(primaryErr)) {
      throw primaryErr;
    }
    console.warn(
      '[Gemini] Primary model unavailable/slow, falling back to gemini-3.1-flash-lite:',
      primaryErr instanceof Error ? primaryErr.message : primaryErr
    );
    const fallbackResponse = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: params.contents,
      config: {
        ...params.config,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.MINIMAL,
        },
      },
    });
    return { response: fallbackResponse, usedModel: 'gemini-3.1-flash-lite' };
  }
}

async function runAiSecurityAnalysis(
  snapshot: ReturnType<SecurityWallEngine['getOverview']>,
  lang: string
) {
  const ai = createGeminiClient(25000);
  const blockedEvents = snapshot.events.filter((e) => e.action === 'blocked' || e.action === 'locked');
  const disclaimer =
    lang === 'ur'
      ? 'نوٹ: ملٹی لیئر فائر وال، ریٹ لمٹنگ اور 2FA سائبر خطرات کو نمایاں طور پر کم کرتے ہیں، لیکن کوئی بھی نظام 100% تحفظ کی ضمانت نہیں دیتا۔'
      : 'Defense-in-depth note: WAF rules, rate limits, 2FA, and Firestore RBAC substantially reduce attack surface, but no system guarantees 100% immunity.';

  if (!ai) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }

  const compactTelemetry = {
    config: snapshot.config,
    metrics: snapshot.metrics,
    blockedIpCount: snapshot.blockedIps.length,
    activeSessionCount: snapshot.sessions.filter((s) => !s.revoked).length,
    recentThreatSummary: snapshot.events.slice(0, 25).map((e) => ({
      threatType: e.threatType,
      severity: e.severity,
      action: e.action,
      path: e.path,
      details: e.details,
      timestamp: e.timestamp,
    })),
    blockedEventCount: blockedEvents.length,
  };

  const { response, usedModel } = await generateWithResilientModel(ai, {
    contents: `Evaluate this live Sitara Cloth House Web Security Wall telemetry and return a concise structured security report in ${
      lang === 'ur' ? 'Urdu (اردو)' : 'English'
    }. Never claim 100% immunity or complete safety:\n${JSON.stringify(compactTelemetry, null, 2)}`,
    config: {
      systemInstruction:
        'You are the Chief Cybersecurity Architect for Sitara Cloth House (sitarakotli.com). Provide realistic, factual threat analysis grounded strictly in the telemetry provided. Never claim 100% protection.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          riskLevel: {
            type: Type.STRING,
            enum: ['low', 'elevated', 'high', 'critical'],
          },
          executiveSummary: { type: Type.STRING },
          detectedPatterns: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          recommendations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                priority: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
                category: { type: Type.STRING },
                title: { type: Type.STRING },
                action: { type: Type.STRING },
              },
              required: ['priority', 'category', 'title', 'action'],
            },
          },
          shouldEnableEmergencyMode: { type: Type.BOOLEAN },
        },
        required: [
          'riskLevel',
          'executiveSummary',
          'detectedPatterns',
          'recommendations',
          'shouldEnableEmergencyMode',
        ],
      },
    },
  });

  const parsed = JSON.parse((response.text || '{}').trim());
  return {
    ...parsed,
    model: usedModel,
    generatedAt: new Date().toISOString(),
    disclaimer,
  };
}

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);

  const securityWall = new SecurityWallEngine();

  // Security headers across all responses + body limit + WAF / DDoS inspection
  app.use(securityWall.securityHeadersMiddleware);
  app.use(express.json({ limit: '8mb' }));
  app.use(securityWall.wafAndDdosMiddleware);

  // Health & Cloud Platform status endpoint
  app.get('/api/health', (_req, res) => {
    const overview = securityWall.getOverview();
    res.json({
      status: 'ok',
      platform: 'Sitara Cloth House Smart Cloud ERP',
      domain: 'https://sitarakotli.com',
      aiConfigured: Boolean(process.env.GEMINI_API_KEY),
      securityWall: {
        firewallEnabled: overview.config.firewallEnabled,
        emergencyMode: overview.config.emergencyMode,
        twoFactorRequired: overview.config.require2faEmailOtp,
      },
      timestamp: new Date().toISOString(),
    });
  });

  // Safe WAF inspection echo endpoint (WAF blocks attacks at 403 first; clean probes require Admin session)
  app.post('/api/security/waf-echo', securityWall.requireAdminSession, (req, res) => {
    res.json({
      passed: true,
      message: 'Request passed server WAF & rate-limit inspection cleanly.',
      receivedKeys: Object.keys(req.body || {}),
      timestamp: new Date().toISOString(),
    });
  });

  // Mount Real Security Wall Routes (/api/security/*)
  app.use(
    '/api/security',
    securityWall.createRouter({
      runAiSecurityAnalysis,
    })
  );

  // Admin-protected AI Security Analysis route alias
  app.post('/api/ai/security-analysis', securityWall.requireAdminSession, async (req, res) => {
    try {
      const { lang = 'en' } = req.body || {};
      const result = await runAiSecurityAnalysis(securityWall.getOverview(), String(lang));
      return res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected AI security analysis error';
      console.error('[/api/ai/security-analysis] error:', message);
      return res.status(500).json({
        error: 'AI_SECURITY_ANALYSIS_FAILED',
        message,
      });
    }
  });

  // Server-side AI Business Insights & Bilingual Product Copy endpoint
  app.post('/api/ai/business-insights', async (req, res) => {
    try {
      const { mode = 'insights', lang = 'en', businessSnapshot, promptContext } = req.body || {};

      const ai = createGeminiClient();
      if (!ai) {
        return res.status(503).json({
          error: 'GEMINI_API_KEY_NOT_CONFIGURED',
          message:
            lang === 'ur'
              ? 'سرور پر GEMINI_API_KEY ابھی سیٹ نہیں ہے۔ برائے مہربانی Settings > Secrets میں شامل کریں۔'
              : 'GEMINI_API_KEY is not configured on the server. Add it in Settings > Secrets to enable live AI analysis.',
        });
      }

      const systemInstruction =
        mode === 'product-copy'
          ? `You are the senior textile merchandising copywriter for Sitara Cloth House (Khudadad Market, Main Bazaar, Kotli, Azad Kashmir). Generate crisp, high-luxury bilingual (English + Urdu) fabric marketing descriptions and WhatsApp promo copy grounded strictly in the provided fabric details. Keep responses structured and concise.`
          : `You are the Chief Retail Financial Advisor for Sitara Cloth House (Kotli, Azad Kashmir). Analyze the provided real store telemetry (daily/monthly/yearly revenue, COGS profit, customer Khata receivables, low stock SKUs, supplier payables) and give 4 concrete, actionable recommendations in ${
              lang === 'ur' ? 'Urdu (اردو)' : 'English'
            } using clear headings and PKR figures.`;

      const userPrompt =
        mode === 'product-copy'
          ? `Create an English + Urdu showroom description and WhatsApp broadcast message for:\n${JSON.stringify(
              promptContext || {},
              null,
              2
            )}`
          : `Analyze this live Sitara Cloth House business snapshot and advise owner Awais Malik:\n${JSON.stringify(
              businessSnapshot || {},
              null,
              2
            )}`;

      const { response, usedModel } = await generateWithResilientModel(ai, {
        contents: userPrompt,
        config: {
          systemInstruction,
        },
      });

      const text = (response.text || '').trim();
      if (!text) {
        return res.status(502).json({
          error: 'EMPTY_AI_RESPONSE',
          message: 'Gemini returned an empty response. Please try again.',
        });
      }

      return res.json({
        analysis: text,
        model: usedModel,
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected Gemini API failure';
      console.error('[/api/ai/business-insights] error:', message);
      return res.status(500).json({
        error: 'AI_REQUEST_FAILED',
        message,
      });
    }
  });

  // Live Global Exchange Rates Proxy (15-min in-memory cache + resilient fallback)
  const REFERENCE_PKR_RATES: Record<string, number> = {
    PKR: 1,
    USD: 0.0036,
    GBP: 0.0028,
    EUR: 0.0033,
    AED: 0.0132,
    SAR: 0.0135,
    CAD: 0.005,
    AUD: 0.0055,
    QAR: 0.0131,
    KWD: 0.0011,
    INR: 0.3,
    CNY: 0.026,
    TRY: 0.123,
    CHF: 0.0032,
    MYR: 0.016,
  };
  let fxCache: {
    rates: Record<string, number>;
    source: 'live-fx' | 'cached-fx' | 'reference-fallback';
    updatedAt: string;
    expiresAt: number;
  } | null = null;

  app.get('/api/global/exchange-rates', async (req, res) => {
    const forceRefresh = req.query.refresh === '1';
    const now = Date.now();
    if (!forceRefresh && fxCache && now < fxCache.expiresAt) {
      return res.json({
        base: 'PKR',
        rates: fxCache.rates,
        source: fxCache.source === 'live-fx' ? 'cached-fx' : fxCache.source,
        updatedAt: fxCache.updatedAt,
      });
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    try {
      const upstream = await fetch('https://open.er-api.com/v6/latest/PKR', {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timer);
      if (upstream.ok) {
        const data = (await upstream.json()) as {
          result?: string;
          rates?: Record<string, number>;
          time_last_update_utc?: string;
        };
        if (data?.rates && typeof data.rates.USD === 'number') {
          const merged: Record<string, number> = { ...REFERENCE_PKR_RATES };
          for (const code of Object.keys(REFERENCE_PKR_RATES)) {
            if (typeof data.rates[code] === 'number' && data.rates[code] > 0) {
              merged[code] = Number(data.rates[code].toFixed(6));
            }
          }
          merged.PKR = 1;
          fxCache = {
            rates: merged,
            source: 'live-fx',
            updatedAt: new Date().toISOString(),
            expiresAt: now + 15 * 60 * 1000,
          };
          return res.json({
            base: 'PKR',
            rates: merged,
            source: 'live-fx',
            updatedAt: fxCache.updatedAt,
          });
        }
      }
    } catch {
      clearTimeout(timer);
    }

    const fallback = {
      rates: fxCache?.rates || REFERENCE_PKR_RATES,
      source: 'reference-fallback' as const,
      updatedAt: fxCache?.updatedAt || new Date().toISOString(),
    };
    return res.json({
      base: 'PKR',
      rates: fallback.rates,
      source: fallback.source,
      updatedAt: fallback.updatedAt,
    });
  });

  // Multilingual AI Customer Support Concierge (server-side @google/genai)
  app.post('/api/ai/customer-support', async (req, res) => {
    try {
      const {
        message = '',
        history = [],
        lang = 'en',
        country = 'Pakistan',
        currency = 'PKR',
        buyingMode = 'retail',
        catalogSummary = [],
      } = req.body || {};

      const cleanMsg = String(message || '').trim().slice(0, 800);
      if (!cleanMsg) {
        return res.status(400).json({ error: 'EMPTY_MESSAGE', message: 'Please enter a message or question.' });
      }

      const ai = createGeminiClient(25000);
      if (!ai) {
        return res.status(503).json({
          error: 'GEMINI_API_KEY_NOT_CONFIGURED',
          message: 'AI Customer Support is unavailable because GEMINI_API_KEY is not configured.',
        });
      }

      const safeHistory = Array.isArray(history)
        ? history.slice(-6).map((h: { role?: string; text?: string }) => ({
            role: h?.role === 'user' ? 'Customer' : 'Concierge',
            text: String(h?.text || '').slice(0, 350),
          }))
        : [];

      const { response, usedModel } = await generateWithResilientModel(ai, {
        contents: JSON.stringify({
          customerLanguageCode: lang,
          visitorCountry: country,
          preferredCurrency: currency,
          buyingMode,
          recentConversation: safeHistory,
          customerQuestion: cleanMsg,
          liveCatalog: Array.isArray(catalogSummary) ? catalogSummary.slice(0, 20) : [],
        }),
        config: {
          systemInstruction: `You are the warm, knowledgeable AI Concierge for Sitara Cloth House (https://sitarakotli.com), located at Khudadad Market, Main Bazaar, Kotli, Azad Kashmir, Pakistan (Contact/WhatsApp: 03425984394, Owner: Awais Malik).
Respond ONLY in the customer's requested language (${lang}). Keep answers concise (2-5 helpful sentences), cite exact SKU codes from liveCatalog when recommending suits, mention wholesale minimum order quantities if buyingMode is wholesale, note DHL/FedEx international shipping or TCS/Kotli local courier as relevant, and never invent products or fake guarantees.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: { type: Type.STRING },
              suggestedSkus: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              suggestedAction: {
                type: Type.STRING,
                enum: ['none', 'open_cart', 'open_whatsapp', 'filter_wholesale'],
              },
            },
            required: ['reply', 'suggestedSkus', 'suggestedAction'],
          },
        },
      });

      const parsed = JSON.parse((response.text || '{}').trim());
      return res.json({
        reply: parsed.reply || '',
        suggestedSkus: Array.isArray(parsed.suggestedSkus) ? parsed.suggestedSkus.slice(0, 4) : [],
        suggestedAction: parsed.suggestedAction || 'none',
        model: usedModel,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected AI support error';
      console.error('[/api/ai/customer-support] error:', message);
      return res.status(500).json({ error: 'AI_SUPPORT_FAILED', message });
    }
  });

  // On-demand Structured Auto-Translation Endpoint (All Languages Support)
  app.post('/api/ai/translate', async (req, res) => {
    try {
      const { texts = {}, targetLang = 'en', targetLangName = 'English' } = req.body || {};
      const entries = Object.entries(texts as Record<string, unknown>)
        .filter(([, v]) => typeof v === 'string' && v.trim().length > 0)
        .slice(0, 40)
        .map(([key, value]) => ({ key, value: String(value).slice(0, 500) }));

      if (entries.length === 0) {
        return res.json({ translations: {} });
      }

      const ai = createGeminiClient(25000);
      if (!ai) {
        return res.status(503).json({
          error: 'GEMINI_API_KEY_NOT_CONFIGURED',
          message: 'Auto-translation requires GEMINI_API_KEY.',
        });
      }

      const { response, usedModel } = await generateWithResilientModel(ai, {
        contents: `Translate the following JSON entries naturally into ${targetLangName} (language code: ${targetLang}). Keep brand names ("Sitara Cloth House", "Kotli", SKU codes, currency codes) accurate:\n${JSON.stringify(entries)}`,
        config: {
          systemInstruction:
            'You are a luxury fashion & e-commerce localization translator. Return exact JSON array of { key, value } keeping every key identical.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    key: { type: Type.STRING },
                    value: { type: Type.STRING },
                  },
                  required: ['key', 'value'],
                },
              },
            },
            required: ['items'],
          },
        },
      });

      const parsed = JSON.parse((response.text || '{}').trim()) as {
        items?: Array<{ key: string; value: string }>;
      };
      const mapped: Record<string, string> = {};
      for (const item of parsed.items || []) {
        if (item.key && item.value) {
          mapped[item.key] = item.value;
        }
      }
      return res.json({ translations: mapped, model: usedModel });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected translation failure';
      console.error('[/api/ai/translate] error:', message);
      return res.status(500).json({ error: 'AI_TRANSLATE_FAILED', message });
    }
  });

  // Smart Search & AI Product Recommendations Endpoint
  app.post('/api/ai/smart-search', async (req, res) => {
    try {
      const { query = '', lang = 'en', catalogSummary = [] } = req.body || {};
      const cleanQuery = String(query || '').trim().slice(0, 300);
      if (!cleanQuery) {
        return res.json({ interpretedIntent: '', recommendedSkus: [] });
      }

      const ai = createGeminiClient(20000);
      if (!ai) {
        return res.status(503).json({
          error: 'GEMINI_API_KEY_NOT_CONFIGURED',
          message: 'Smart AI search requires GEMINI_API_KEY.',
        });
      }

      const { response, usedModel } = await generateWithResilientModel(ai, {
        contents: JSON.stringify({
          searchQuery: cleanQuery,
          lang,
          catalog: Array.isArray(catalogSummary) ? catalogSummary.slice(0, 25) : [],
        }),
        config: {
          systemInstruction:
            'You are a textile search & recommendation engine for Sitara Cloth House. Match the user query (any language) to up to 4 most relevant SKU strings from the provided catalog and summarize the intent briefly in the requested language.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              interpretedIntent: { type: Type.STRING },
              recommendedSkus: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['interpretedIntent', 'recommendedSkus'],
          },
        },
      });

      const parsed = JSON.parse((response.text || '{}').trim());
      return res.json({
        interpretedIntent: parsed.interpretedIntent || '',
        recommendedSkus: Array.isArray(parsed.recommendedSkus) ? parsed.recommendedSkus.slice(0, 4) : [],
        model: usedModel,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Smart search error';
      console.error('[/api/ai/smart-search] error:', message);
      return res.status(500).json({ error: 'AI_SMART_SEARCH_FAILED', message });
    }
  });

  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('/{*path}', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sitara Cloth House Smart Cloud Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
