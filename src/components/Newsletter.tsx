import React, { useState } from 'react';
import { Check, Copy, Mail, ArrowRight } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { validateNewsletterEmail } from '../utils/logic';

type NewsletterErrorCode = 'empty' | 'invalid' | 'duplicate';

export const Newsletter: React.FC = () => {
  const { lang, t, newsletterSubscribers, subscribeNewsletter } = useShop();

  const [email, setEmail] = useState('');
  const [errorCode, setErrorCode] = useState<NewsletterErrorCode | null>(null);
  const [subscribedEmail, setSubscribedEmail] = useState<string | null>(() => {
    if (newsletterSubscribers.length > 0) {
      return newsletterSubscribers[0].email;
    }
    return null;
  });
  const [copiedCode, setCopiedCode] = useState(false);

  const welcomePromoCode = 'LUXURY10';

  const errorMessage =
    errorCode === 'empty'
      ? t.newsletterErrorEmpty
      : errorCode === 'invalid'
      ? t.newsletterErrorInvalid
      : errorCode === 'duplicate'
      ? t.newsletterErrorDuplicate
      : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateNewsletterEmail(email);

    if (!validation.isValid) {
      setErrorCode(validation.errorCode === 'empty' ? 'empty' : 'invalid');
      return;
    }

    const result = subscribeNewsletter(validation.normalizedEmail);
    if (!result.success) {
      setErrorCode(result.reason === 'duplicate' ? 'duplicate' : 'invalid');
      return;
    }

    setErrorCode(null);
    setSubscribedEmail(validation.normalizedEmail);
    setEmail('');
  };

  const handleCopyPromo = () => {
    navigator.clipboard?.writeText(welcomePromoCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleSubscribeAnother = () => {
    setSubscribedEmail(null);
    setErrorCode(null);
    setEmail('');
  };

  return (
    <section
      id="newsletter"
      aria-labelledby="newsletter-heading"
      className="py-16 bg-stone-950 border-t border-stone-800/80"
    >
      <div className="max-w-5xl mx-auto px-4">
        <div className="rounded-2xl bg-gradient-to-b from-stone-900/90 to-stone-950 border border-amber-500/25 p-7 sm:p-12 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Editorial Copy */}
            <div className="lg:col-span-6 space-y-3 text-center lg:text-start">
              <p className="text-xs font-semibold tracking-[0.22em] uppercase text-amber-400">
                {t.newsletterKicker}
              </p>
              <h2
                id="newsletter-heading"
                className="font-serif-luxury text-2xl sm:text-3xl font-bold text-stone-100 leading-snug text-balance"
              >
                {t.newsletterTitle}
              </h2>
              <p className="text-stone-400 text-sm leading-relaxed max-w-xl mx-auto lg:mx-0">
                {t.newsletterSubtitle}
              </p>
              <p className="text-xs text-stone-400 pt-1">
                {t.newsletterPerkText}
              </p>
            </div>

            {/* Subscription Form or Confirmation State */}
            <div className="lg:col-span-6">
              {subscribedEmail ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="rounded-xl bg-stone-900/90 border border-amber-500/30 p-6 space-y-4 text-center sm:text-start"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-center sm:justify-start gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                      <Check className="w-4 h-4 shrink-0" />
                      <span>{t.newsletterSuccessTitle}</span>
                    </div>
                    <p className="text-sm text-stone-200">
                      {t.newsletterSuccessDesc}{' '}
                      <span className="font-medium text-amber-300 break-all">{subscribedEmail}</span>
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-stone-800">
                    <div className="text-xs text-stone-400">
                      <span>{t.newsletterPromoLabel} </span>
                      <span className="font-mono font-bold text-amber-300 tracking-wider">
                        {welcomePromoCode}
                      </span>
                    </div>
                    <div className="flex items-center justify-center sm:justify-end gap-3">
                      <button
                        type="button"
                        onClick={handleCopyPromo}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-300 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        {copiedCode ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{t.codeCopied}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>{t.copyCode}</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleSubscribeAnother}
                        className="text-xs text-stone-400 hover:text-amber-300 underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        {t.newsletterAnotherBtn}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <form noValidate onSubmit={handleSubmit} className="space-y-3">
                  <label
                    htmlFor="newsletter-email"
                    className="block text-xs font-semibold text-stone-300"
                  >
                    {t.newsletterEmailLabel}
                  </label>

                  <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                    <div className="relative flex-1">
                      <Mail
                        aria-hidden="true"
                        className={`w-4 h-4 text-stone-500 absolute top-1/2 -translate-y-1/2 pointer-events-none ${
                          lang === 'ur' ? 'right-3.5' : 'left-3.5'
                        }`}
                      />
                      <input
                        id="newsletter-email"
                        name="email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (errorCode) setErrorCode(null);
                        }}
                        placeholder={t.newsletterEmailPlaceholder}
                        aria-invalid={Boolean(errorMessage)}
                        aria-describedby={errorMessage ? 'newsletter-email-error' : undefined}
                        className={`w-full h-12 bg-stone-900 border rounded-xl text-sm text-stone-100 placeholder:text-stone-500 focus:outline-none focus:ring-2 transition-colors ${
                          lang === 'ur' ? 'pr-10 pl-4' : 'pl-10 pr-4'
                        } ${
                          errorMessage
                            ? 'border-rose-500/80 focus:border-rose-400 focus:ring-rose-500/20'
                            : 'border-stone-700 focus:border-amber-400 focus:ring-amber-400/20'
                        }`}
                      />
                    </div>

                    <button
                      type="submit"
                      className="h-12 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-stone-950 font-bold text-sm tracking-wide hover:brightness-110 active:scale-[0.99] transition-all inline-flex items-center justify-center gap-2 shadow-lg shadow-amber-500/15 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <span>{t.newsletterSubmitBtn}</span>
                      <ArrowRight aria-hidden="true" className={`w-4 h-4 ${lang === 'ur' ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {errorMessage && (
                    <p
                      id="newsletter-email-error"
                      role="alert"
                      className="text-xs font-medium text-rose-400 pt-0.5"
                    >
                      {errorMessage}
                    </p>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
