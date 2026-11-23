import React from 'react';
import { ShopProvider, useShop } from './context/ShopContext';
import { Navbar } from './components/Navbar';
import { LuxuryBannerSlider } from './components/LuxuryBannerSlider';
import { PromoOffers } from './components/PromoOffers';
import { CategoryTabs } from './components/CategoryTabs';
import { ProductGrid } from './components/ProductGrid';
import { CustomerReviews } from './components/CustomerReviews';
import { GoogleMapSection } from './components/GoogleMapSection';
import { ContactSection } from './components/ContactSection';
import { Newsletter } from './components/Newsletter';
import { Footer } from './components/Footer';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { CustomerAuthModal } from './components/CustomerAuthModal';
import { AdminDashboard } from './components/AdminDashboard';
import { LogoEditorModal } from './components/LogoEditorModal';
import { OfflineIndicator } from './components/CloudSyncStatusBar';
import { GlobalRegionBar } from './components/GlobalRegionBar';
import { AiGlobalAssistant } from './components/AiGlobalAssistant';
import { MessageCircle } from 'lucide-react';
import { sanitizePhoneForWhatsApp } from './utils/logic';

const MainLayout: React.FC = () => {
  const { shopProfile, isLogoModalOpen, setIsLogoModalOpen } = useShop();
  const waNumber = sanitizePhoneForWhatsApp(shopProfile.whatsapp || '03425984394');

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)] flex flex-col font-sans selection:bg-amber-500 selection:text-stone-950 transition-colors duration-300 overflow-x-clip">
      {/* Navigation */}
      <Navbar />

      {/* Main Flow */}
      <main className="flex-1">
        <LuxuryBannerSlider />
        <GlobalRegionBar />
        <PromoOffers />
        <CategoryTabs />
        <ProductGrid />
        <CustomerReviews />
        <GoogleMapSection />
        <ContactSection />
        <Newsletter />
      </main>

      {/* Footer */}
      <Footer />

      {/* Overlays and Modals */}
      <ProductDetailModal />
      <CartDrawer />
      <CheckoutModal />
      <CustomerAuthModal />
      <AdminDashboard />
      <LogoEditorModal isOpen={isLogoModalOpen} onClose={() => setIsLogoModalOpen(false)} />
      <OfflineIndicator />
      <AiGlobalAssistant />

      {/* Floating Instant WhatsApp Button */}
      <a
        href={`https://wa.me/${waNumber}?text=${encodeURIComponent('Assalam-o-Alaikum Sitara Cloth House, I want to inquire about fabrics in your Kotli store.')}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 w-13 h-13 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xl shadow-emerald-950 flex items-center justify-center hover:scale-105 active:scale-95 transition-all border border-emerald-400/40"
        title="Chat on WhatsApp: 03425984394"
        aria-label="Direct WhatsApp Order"
      >
        <MessageCircle className="w-6 h-6 fill-white/10" />
      </a>
    </div>
  );
};

export default function App() {
  return (
    <ShopProvider>
      <MainLayout />
    </ShopProvider>
  );
}
