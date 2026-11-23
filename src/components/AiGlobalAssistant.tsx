import React, { useState, useRef } from 'react';
import {
  Bot,
  X,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  MessageSquare,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { smartSearchAndRecommend } from '../utils/globalBusiness';
import { Product } from '../types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  recommendations?: Product[];
}

export const AiGlobalAssistant: React.FC = () => {
  const {
    lang,
    t,
    selectedCountry,
    currency,
    products,
    setSelectedProduct,
    formatPrice,
  } = useShop();

  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      text:
        lang === 'ur'
          ? 'السلام علیکم! میں ستارہ کلاٹھ ہاؤس کا AI اسسٹنٹ ہوں۔ آپ کھدر، لینن، بوسکی، ہول سیل ریٹس یا عالمی ڈلیوری کے بارے میں اردو یا انگریزی میں پوچھ سکتے ہیں۔'
          : 'Assalam-o-Alaikum! I am the Sitara Cloth House AI Concierge. Ask about Khaddar, Linen, Boski, Chiffon, wholesale pricing, or worldwide DHL/FedEx shipping in English or Urdu.',
    },
  ]);
  const [isSending, setIsSending] = useState(false);
  const [voiceLang, setVoiceLang] = useState<'en-US' | 'ur-PK'>(lang === 'ur' ? 'ur-PK' : 'en-US');
  const [isListening, setIsListening] = useState(false);
  const [speakReplies, setSpeakReplies] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const speakText = (text: string, targetLang: 'en-US' | 'ur-PK') => {
    if (!speakReplies || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.slice(0, 320));
      utterance.lang = targetLang;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore synthesis failure on headless devices
    }
  };

  const sendQuery = async (rawQuery: string) => {
    const clean = rawQuery.trim();
    if (!clean || isSending) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: clean,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsSending(true);
    setVoiceNotice(null);

    const localRecs = smartSearchAndRecommend(products, clean, 3);

    try {
      const res = await fetch('/api/ai/customer-support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: clean,
          lang,
          country: selectedCountry,
          currency,
          productsSummary: products.slice(0, 18).map((p) => ({
            id: p.id,
            sku: p.sku,
            title: p.title,
            category: p.category,
            gender: p.gender,
            pricePKR: p.price,
            wholesalePricePKR: p.wholesalePrice,
          })),
        }),
      });

      let replyText = '';
      let recs: Product[] = localRecs;

      if (res.ok) {
        const data = await res.json();
        if (typeof data.reply === 'string' && data.reply.trim()) {
          replyText = data.reply.trim();
        }
        if (Array.isArray(data.recommendedProductIds) && data.recommendedProductIds.length > 0) {
          const matched = products.filter((p) => data.recommendedProductIds.includes(p.id));
          if (matched.length > 0) {
            recs = matched.slice(0, 3);
          }
        }
      }

      if (!replyText) {
        replyText =
          voiceLang === 'ur-PK'
            ? `آپ کی تلاش "${clean}" کے مطابق ستارہ کلاٹھ ہاؤس کوٹلی کی بہترین کلیکشن نیچے موجود ہے۔ ہول سیل آرڈرز (5+ سوٹس) پر خصوصی ڈسکاؤنٹ دستیاب ہے۔`
            : `Based on "${clean}", here are handpicked fabrics from Sitara Cloth House Kotli. Wholesale rates apply on 5+ pieces and worldwide DHL/FedEx shipping is active.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          text: replyText,
          recommendations: recs,
        },
      ]);
      speakText(replyText, voiceLang);
    } catch {
      const fallbackText =
        voiceLang === 'ur-PK'
          ? `آپ کی پسند کے مطابق "${clean}" کے بہترین کپڑے نیچے دکھائے جا رہے ہیں۔ براہ راست مدد کے لیے واٹس ایپ 03425984394 پر رابطہ کریں۔`
          : `Showing matched selections for "${clean}" from our Kotli showroom inventory. For bespoke tailoring or bulk trade pricing, WhatsApp 03425984394.`;

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-fb-${Date.now()}`,
          role: 'assistant',
          text: fallbackText,
          recommendations: localRecs,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const toggleVoiceAssistant = () => {
    setVoiceNotice(null);
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore stop error
      }
      setIsListening(false);
      return;
    }

    const SpeechRec =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (!SpeechRec) {
      setVoiceNotice(
        voiceLang === 'ur-PK'
          ? 'آپ کے براؤزر میں وائس مائیک دستیاب نہیں، نیچے ٹائپ کر کے پوچھیں۔'
          : 'Microphone speech recognition is not supported in this browser — type your question below.'
      );
      return;
    }

    try {
      const rec = new SpeechRec();
      rec.lang = voiceLang;
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = (event: any) => {
        const transcript = event?.results?.[0]?.[0]?.transcript || '';
        setIsListening(false);
        if (transcript.trim()) {
          void sendQuery(transcript);
        }
      };
      rec.onerror = () => {
        setIsListening(false);
        setVoiceNotice('Voice capture interrupted or microphone permission denied.');
      };
      rec.onend = () => setIsListening(false);
      recognitionRef.current = rec;
      rec.start();
      setIsListening(true);
    } catch {
      setIsListening(false);
      setVoiceNotice('Unable to initialize microphone in current environment.');
    }
  };

  const suggestions = [
    'Winter Gents Khaddar',
    'Wholesale Silk Rates',
    'DHL Shipping to UK',
    'سردیوں کا کھدر دکھائیں',
  ];

  return (
    <>
      {/* Launcher Button */}
      {!isOpen && (
        <button
          type="button"
          data-testid="ai-assistant-launcher"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-6 z-40 px-3.5 py-2.5 rounded-full bg-stone-900/95 hover:bg-stone-800 border border-amber-500/50 text-amber-300 shadow-2xl flex items-center gap-2 text-xs font-bold transition-all hover:scale-105 cursor-pointer"
          title="Open Sitara AI Concierge & Urdu/English Voice Assistant"
          aria-label="Open Sitara AI Concierge"
        >
          <Bot className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline">Sitara AI</span>
        </button>
      )}

      {/* Assistant Drawer Modal */}
      {isOpen && (
        <div
          data-testid="ai-assistant-panel"
          className="fixed bottom-4 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 max-h-[80vh] bg-stone-950 border border-amber-500/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in duration-200"
        >
          {/* Header */}
          <div className="p-4 bg-stone-900 border-b border-stone-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-bold text-stone-100 truncate">{t.aiConciergeTitle}</h3>
                <p className="text-[10px] text-stone-400 truncate">{t.aiConciergeSubtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Voice Language Toggle */}
              <button
                type="button"
                data-testid="ai-voice-lang-toggle"
                onClick={() => setVoiceLang((v) => (v === 'en-US' ? 'ur-PK' : 'en-US'))}
                className="px-2 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-700 text-[10px] font-mono font-bold text-amber-300 cursor-pointer"
                title="Switch Voice Assistant Language (Urdu / English)"
              >
                {voiceLang === 'ur-PK' ? 'اردو' : 'EN'}
              </button>

              {/* Speech Output Toggle */}
              <button
                type="button"
                onClick={() => setSpeakReplies((s) => !s)}
                className="p-1.5 rounded-lg bg-stone-800 text-stone-300 hover:text-amber-400 cursor-pointer"
                title={speakReplies ? 'Mute spoken replies' : 'Speak AI replies aloud'}
              >
                {speakReplies ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 cursor-pointer"
                aria-label="Close AI Concierge"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] px-3 py-2 rounded-2xl leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-amber-500 text-stone-950 font-semibold rounded-br-sm'
                      : 'bg-stone-900 border border-stone-800 text-stone-200 rounded-bl-sm'
                  }`}
                >
                  {msg.text}
                </div>

                {msg.recommendations && msg.recommendations.length > 0 && (
                  <div className="mt-2 w-full space-y-1.5">
                    {msg.recommendations.map((rec) => (
                      <button
                        key={rec.id}
                        type="button"
                        onClick={() => {
                          setSelectedProduct(rec);
                          setIsOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 p-2 rounded-xl bg-stone-900/90 border border-stone-800 hover:border-amber-500/50 text-left transition-all cursor-pointer"
                      >
                        <img
                          src={rec.image}
                          alt={rec.title}
                          className="w-9 h-9 rounded-lg object-cover shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-semibold text-stone-100 truncate">{rec.title}</p>
                          <p className="text-[10px] text-amber-400 font-bold">{formatPrice(rec.price)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isSending && (
              <div className="text-[11px] text-amber-400 font-mono flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>Consulting Sitara Fabric Concierge...</span>
              </div>
            )}

            {voiceNotice && (
              <p className="text-[11px] text-amber-300 bg-amber-950/40 border border-amber-500/30 rounded-xl p-2">
                {voiceNotice}
              </p>
            )}
          </div>

          {/* Quick Suggestion Chips */}
          <div className="px-3 pb-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {suggestions.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => void sendQuery(chip)}
                className="shrink-0 px-2.5 py-1 rounded-full bg-stone-900 border border-stone-800 hover:border-amber-500/40 text-stone-300 text-[10px] font-medium cursor-pointer"
              >
                <MessageSquare className="w-2.5 h-2.5 inline mr-1 text-amber-400" />
                {chip}
              </button>
            ))}
          </div>

          {/* Input + Voice Mic Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendQuery(inputText);
            }}
            className="p-3 bg-stone-900 border-t border-stone-800 flex items-center gap-2"
          >
            <button
              type="button"
              data-testid="ai-voice-mic-btn"
              onClick={toggleVoiceAssistant}
              className={`p-2 rounded-xl border transition-all cursor-pointer shrink-0 ${
                isListening
                  ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                  : 'bg-stone-950 border-stone-700 text-amber-400 hover:border-amber-400'
              }`}
              title={isListening ? t.voiceListeningLabel : `${t.voiceStartLabel} (${voiceLang})`}
              aria-label="Toggle Voice Assistant"
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              type="text"
              data-testid="ai-assistant-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                voiceLang === 'ur-PK' ? 'اردو یا انگریزی میں سوال پوچھیں...' : 'Ask about fabrics, wholesale, or DHL shipping...'
              }
              className="flex-1 bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-400"
            />

            <button
              type="submit"
              data-testid="ai-assistant-send"
              disabled={!inputText.trim() || isSending}
              className="p-2 rounded-xl bg-amber-500 text-stone-950 font-bold hover:brightness-110 disabled:opacity-50 cursor-pointer shrink-0"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
