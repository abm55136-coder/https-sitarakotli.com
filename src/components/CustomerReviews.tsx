import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { Star, ShieldCheck, MessageSquarePlus, Sparkles, MapPin, X } from 'lucide-react';

export const CustomerReviews: React.FC = () => {
  const { lang, t, reviews, addReview, isReviewModalOpen, setIsReviewModalOpen } = useShop();

  const [author, setAuthor] = useState('');
  const [authorLocation, setAuthorLocation] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [productTitle, setProductTitle] = useState('Pure Royal Chinese Boski Silk');

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !comment.trim()) return;

    addReview({
      author: author.trim(),
      authorLocation: authorLocation.trim() || 'Kotli, Azad Kashmir',
      rating,
      comment: comment.trim(),
      verifiedPurchase: true,
      productTitle,
    });

    setAuthor('');
    setAuthorLocation('');
    setComment('');
    setIsReviewModalOpen(false);
  };

  return (
    <section id="reviews" className="py-14 bg-stone-900/40 border-t border-stone-800/80">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{lang === 'ur' ? 'اعتماد و اطمینان' : 'AUTHENTIC TESTIMONIALS'}</span>
            </div>
            <h2 className="font-serif-luxury text-2xl sm:text-4xl font-bold text-stone-100">
              {t.reviewsTitle}
            </h2>
            <p className="text-stone-400 text-sm mt-1 max-w-xl">{t.reviewsSubtitle}</p>
          </div>

          <button
            onClick={() => setIsReviewModalOpen(true)}
            className="self-start md:self-auto px-5 py-2.5 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>{t.writeReviewBtn}</span>
          </button>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-5 rounded-2xl bg-stone-950 border border-stone-800 hover:border-amber-900/40 transition-all flex flex-col justify-between shadow-lg"
            >
              <div className="space-y-3">
                {/* Rating Stars & Verified Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-700'}`}
                      />
                    ))}
                  </div>
                  {rev.verifiedPurchase && (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/20">
                      <ShieldCheck className="w-3 h-3" />
                      <span>{t.verifiedBuyer}</span>
                    </span>
                  )}
                </div>

                {/* Comment */}
                <p className="text-stone-300 text-xs sm:text-sm leading-relaxed italic">
                  "{lang === 'ur' && rev.commentUrdu ? rev.commentUrdu : rev.comment}"
                </p>

                {/* Fabric item purchased */}
                {rev.productTitle && (
                  <p className="text-[11px] text-amber-400/80 font-mono">
                    Fabric: {rev.productTitle}
                  </p>
                )}
              </div>

              {/* Author Info */}
              <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-bold text-stone-200">{rev.author}</h4>
                  <div className="flex items-center gap-1 text-stone-500 text-[11px] mt-0.5">
                    <MapPin className="w-3 h-3 text-amber-400/80" />
                    <span>{rev.authorLocation}</span>
                  </div>
                </div>
                <span className="text-[10px] text-stone-600">{rev.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Review Submission Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-stone-900 border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <button
              onClick={() => setIsReviewModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-serif-luxury text-xl font-bold text-stone-100 mb-1">
              {t.reviewModalTitle}
            </h3>
            <p className="text-stone-400 text-xs mb-5">
              Khudadad Market, Main Bazaar, Kotli, Azad Kashmir.
            </p>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  {t.yourRating}
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      type="button"
                      key={num}
                      onClick={() => setRating(num)}
                      className="p-1 text-amber-400 hover:scale-110 transition-transform"
                    >
                      <Star className={`w-6 h-6 ${num <= rating ? 'fill-amber-400' : 'text-stone-700'}`} />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-amber-300 ml-2">{rating} / 5 Stars</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  {t.yourName} *
                </label>
                <input
                  type="text"
                  required
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="e.g. Sardar Naveed Khan"
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  {t.yourCity}
                </label>
                <input
                  type="text"
                  value={authorLocation}
                  onChange={(e) => setAuthorLocation(e.target.value)}
                  placeholder="e.g. Main Bazaar Kotli, Azad Kashmir"
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Fabric Purchased
                </label>
                <select
                  value={productTitle}
                  onChange={(e) => setProductTitle(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-400"
                >
                  <option value="Pure Royal Chinese Boski Silk">Pure Royal Chinese Boski Silk</option>
                  <option value="Handloom Kohistan Winter Karandi">Handloom Kohistan Winter Karandi</option>
                  <option value="Luxury Embroidered Chiffon 3-Piece">Luxury Embroidered Chiffon 3-Piece</option>
                  <option value="Super Soft Giza Egyptian Cotton Latha">Super Soft Giza Egyptian Cotton Latha</option>
                  <option value="Executive Wrinkle-Free Wash & Wear">Executive Wrinkle-Free Wash & Wear</option>
                  <option value="Junior Prince Embroidered Kurta Shalwar">Junior Prince Embroidered Kurta Shalwar</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  {t.yourReview} *
                </label>
                <textarea
                  required
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience about the fabric quality, drape, and service..."
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-stone-950 font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                {t.submitReview}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
