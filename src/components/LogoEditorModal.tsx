import React, { useRef, useState } from 'react';
import { useShop } from '../context/ShopContext';
import { LogoConfig, LogoIconType, LogoShape } from '../types';
import {
  X,
  Sparkles,
  Crown,
  Star,
  Gem,
  Scissors,
  Feather,
  Upload,
  Camera,
  Image as ImageIcon,
  Check,
  RotateCcw,
  Palette,
  Eye,
  Folder,
} from 'lucide-react';
import { INITIAL_LOGO_CONFIG } from '../data/initialData';
import { BrandLogo } from './BrandLogo';
import { CameraCaptureModal } from './CameraCaptureModal';
import { MediaLibraryModal } from './MediaLibraryModal';

interface LogoEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LogoEditorModal: React.FC<LogoEditorModalProps> = ({ isOpen, onClose }) => {
  const { logoConfig, updateLogoConfig, addMediaAsset } = useShop();

  const [form, setForm] = useState<LogoConfig>({ ...logoConfig });
  const [activeTab, setActiveTab] = useState<'emblem' | 'image' | 'text' | 'style'>('emblem');
  const [previewBg, setPreviewBg] = useState<'dark' | 'light'>('dark');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sub-modals for image selection
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isMediaLibraryActive, setIsMediaLibraryActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Handle local file upload from Android Gallery or desktop
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        setForm((prev) => ({
          ...prev,
          type: 'custom_image',
          imageUrl: url,
        }));
        // Save to media library as well
        addMediaAsset({
          title: `Logo - ${file.name.slice(0, 20)}`,
          url,
          category: 'profiles',
          source: 'gallery',
          sizeBytes: file.size,
          description: 'Uploaded brand logo picture for Sitara Cloth House',
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateLogoConfig(form);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 800);
  };

  const handleResetDefault = () => {
    setForm({ ...INITIAL_LOGO_CONFIG });
  };

  const shapes: { id: LogoShape; label: string }[] = [
    { id: 'round', label: 'Classic Seal' },
    { id: 'crest', label: 'Royal Crest' },
    { id: 'shield', label: 'Heritage Shield' },
    { id: 'diamond', label: 'Luxury Diamond' },
    { id: 'minimal', label: 'Minimalist' },
  ];

  const icons: { id: LogoIconType; label: string; icon: React.ReactNode }[] = [
    { id: 'sparkles', label: 'Sparkles', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'crown', label: 'Crown', icon: <Crown className="w-4 h-4" /> },
    { id: 'star', label: 'Sitara Star', icon: <Star className="w-4 h-4" fill="currentColor" /> },
    { id: 'diamond', label: 'Diamond', icon: <Gem className="w-4 h-4" /> },
    { id: 'scissors', label: 'Tailor Scissors', icon: <Scissors className="w-4 h-4" /> },
    { id: 'feather', label: 'Pashmina Quill', icon: <Feather className="w-4 h-4" /> },
  ];

  const colorPalettes = [
    { name: '24K Royal Gold', hex: '#d4af37' },
    { name: 'Antique Brass', hex: '#c5a059' },
    { name: 'Imperial Emerald', hex: '#10b981' },
    { name: 'Rose Gold', hex: '#fb7185' },
    { name: 'Platinum Ice', hex: '#38bdf8' },
    { name: 'Royal Velvet', hex: '#c084fc' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-5 backdrop-blur-md">
      <div className="relative flex flex-col w-full max-w-3xl max-h-[92vh] bg-stone-900 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 border-b border-amber-500/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Brand Logo Upgrade & Design Studio</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold uppercase">
                  Awais Malik Portal
                </span>
              </h3>
              <p className="text-xs text-stone-400">
                Customize Sitara Cloth House emblem, logo picture, Urdu typography & heraldry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Preview Bar */}
        <div className="p-4 bg-stone-950/80 border-b border-amber-900/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-stone-400">
            <Eye className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-stone-200">Live Header Preview:</span>
            <div className="flex items-center gap-1 ml-2">
              <button
                type="button"
                onClick={() => setPreviewBg('dark')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                  previewBg === 'dark'
                    ? 'bg-stone-800 text-amber-300 border-amber-500/50'
                    : 'text-stone-400 border-transparent hover:text-stone-200'
                }`}
              >
                Dark Canvas
              </button>
              <button
                type="button"
                onClick={() => setPreviewBg('light')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                  previewBg === 'light'
                    ? 'bg-stone-100 text-stone-900 border-stone-300'
                    : 'text-stone-400 border-transparent hover:text-stone-200'
                }`}
              >
                Light Canvas
              </button>
            </div>
          </div>

          <div
            className={`px-4 py-2.5 rounded-xl border transition-all ${
              previewBg === 'dark'
                ? 'bg-stone-950 border-stone-800'
                : 'bg-white border-stone-200 shadow-sm'
            }`}
          >
            <BrandLogo customConfig={form} showSubtext={true} showUrdu={form.showUrdu} />
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-stone-800 bg-stone-900">
          <button
            onClick={() => setActiveTab('emblem')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'emblem'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Emblem & Shape</span>
          </button>
          <button
            onClick={() => setActiveTab('image')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'image'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Upload Picture</span>
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'text'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <span>Brand Typography</span>
          </button>
          <button
            onClick={() => setActiveTab('style')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'style'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Color & Scale</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* TAB 1: EMBLEM & SHAPE */}
          {activeTab === 'emblem' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-2">
                  Select Emblem Style Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: 'icon_emblem' })}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      form.type === 'icon_emblem'
                        ? 'bg-amber-500/15 border-amber-400 text-white shadow-md'
                        : 'bg-stone-950/40 border-stone-800 text-stone-400 hover:bg-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs text-amber-300">
                      <Sparkles className="w-4 h-4" />
                      <span>Luxury Heraldic Emblem</span>
                    </div>
                    <p className="text-[11px] text-stone-400 mt-1">
                      Vector insignia with customizable crowns, stars & royal crests
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: 'custom_image' })}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      form.type === 'custom_image'
                        ? 'bg-amber-500/15 border-amber-400 text-white shadow-md'
                        : 'bg-stone-950/40 border-stone-800 text-stone-400 hover:bg-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs text-amber-300">
                      <ImageIcon className="w-4 h-4" />
                      <span>Custom Photo / Graphic Logo</span>
                    </div>
                    <p className="text-[11px] text-stone-400 mt-1">
                      Direct photo upload from phone gallery, camera or logo file
                    </p>
                  </button>
                </div>
              </div>

              {/* Emblem Shape Selection */}
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-2">
                  Emblem Geometric Seal
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {shapes.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setForm({ ...form, shape: s.id })}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                        form.shape === s.id
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                          : 'bg-stone-950/40 border-stone-800 text-stone-400 hover:bg-stone-800'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 border border-amber-400/60 flex items-center justify-center ${
                          s.id === 'round'
                            ? 'rounded-full'
                            : s.id === 'crest'
                            ? 'rounded-b-lg'
                            : s.id === 'shield'
                            ? 'rounded-b-2xl'
                            : s.id === 'diamond'
                            ? 'rotate-45 scale-75'
                            : 'rounded-md'
                        }`}
                      />
                      <span className="text-[11px]">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Insignia Icon Selection */}
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-2">
                  Insignia Icon Symbol
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {icons.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setForm({ ...form, icon: item.id, type: 'icon_emblem' })}
                      className={`p-2.5 rounded-xl border flex items-center gap-2.5 text-xs transition-all ${
                        form.icon === item.id && form.type === 'icon_emblem'
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                          : 'bg-stone-950/40 border-stone-800 text-stone-400 hover:bg-stone-800'
                      }`}
                    >
                      <div className="text-amber-400">{item.icon}</div>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD PICTURE */}
          {activeTab === 'image' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-stone-950/60 border border-stone-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-300">
                    📸 Upload or Change Custom Logo Picture
                  </span>
                  <span className="text-[11px] text-stone-500">Android Gallery & Camera ready</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Current image preview */}
                  <div className="relative w-24 h-24 rounded-2xl bg-stone-900 border border-amber-500/40 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                    {form.imageUrl ? (
                      <img
                        src={form.imageUrl}
                        alt="Logo Preview"
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <div className="text-center text-stone-500 p-2 text-[10px]">
                        No image selected
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2.5 w-full">
                    {/* Direct Android Gallery File Input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-semibold border border-stone-700 transition-all"
                      >
                        <Upload className="w-3.5 h-3.5 text-amber-400" />
                        <span>Android Gallery</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsCameraActive(true)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-semibold border border-stone-700 transition-all"
                      >
                        <Camera className="w-3.5 h-3.5 text-amber-400" />
                        <span>Live Camera</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsMediaLibraryActive(true)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold border border-amber-500/40 transition-all"
                      >
                        <Folder className="w-3.5 h-3.5" />
                        <span>Media Library</span>
                      </button>
                    </div>

                    <div>
                      <input
                        type="text"
                        value={form.imageUrl || ''}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            type: 'custom_image',
                            imageUrl: e.target.value,
                          })
                        }
                        placeholder="Or enter public image URL (https://...)"
                        className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BRAND TYPOGRAPHY */}
          {activeTab === 'text' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">
                    Primary Brand Wordmark
                  </label>
                  <input
                    type="text"
                    required
                    value={form.primaryText}
                    onChange={(e) => setForm({ ...form, primaryText: e.target.value.toUpperCase() })}
                    placeholder="e.g. SITARA"
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white focus:outline-none focus:border-amber-400 font-serif-luxury"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">
                    Secondary Wordmark
                  </label>
                  <input
                    type="text"
                    value={form.secondaryText}
                    onChange={(e) => setForm({ ...form, secondaryText: e.target.value.toUpperCase() })}
                    placeholder="e.g. CLOTH HOUSE"
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">
                    عنوان (Urdu Brand Title)
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    value={form.urduText}
                    onChange={(e) => setForm({ ...form, urduText: e.target.value })}
                    placeholder="مثال: ستارہ کلاٹھ ہاؤس"
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white font-urdu focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">
                    Subtitle / Region Location
                  </label>
                  <input
                    type="text"
                    value={form.subtext}
                    onChange={(e) => setForm({ ...form, subtext: e.target.value.toUpperCase() })}
                    placeholder="e.g. KOTLI • AZAD KASHMIR"
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">
                    Established Badge / Tag (Optional)
                  </label>
                  <input
                    type="text"
                    value={form.badgeText || ''}
                    onChange={(e) => setForm({ ...form, badgeText: e.target.value.toUpperCase() })}
                    placeholder="e.g. EST. 1998 or KOTLI"
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <label className="flex items-center gap-2 text-xs text-stone-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.showUrdu}
                      onChange={(e) => setForm({ ...form, showUrdu: e.target.checked })}
                      className="rounded bg-stone-950 border-stone-700 text-amber-500 focus:ring-0"
                    />
                    <span>Display Urdu Calligraphy in Header (ستارہ کلاٹھ ہاؤس)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: COLOR & SCALE */}
          {activeTab === 'style' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-2">
                  Emblem Accent Color
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {colorPalettes.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setForm({ ...form, accentColor: c.hex })}
                      className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs transition-all ${
                        form.accentColor === c.hex
                          ? 'border-white text-white font-bold bg-stone-800'
                          : 'border-stone-800 text-stone-400 hover:bg-stone-800'
                      }`}
                    >
                      <div
                        className="w-4 h-4 rounded-full border border-white/20 shrink-0"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-2">
                  Logo Size Scaling in Header
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'compact', label: 'Compact (Slim)' },
                    { id: 'standard', label: 'Standard (Balanced)' },
                    { id: 'prominent', label: 'Prominent (Large Luxury)' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setForm({ ...form, sizeScale: s.id as any })}
                      className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                        form.sizeScale === s.id
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                          : 'bg-stone-950/40 border-stone-800 text-stone-400 hover:bg-stone-800'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-stone-800 flex items-center justify-between">
            <button
              type="button"
              onClick={handleResetDefault}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-stone-400 hover:text-stone-200 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Sitara Original</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-6 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-stone-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition-all"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Logo Saved!</span>
                  </>
                ) : (
                  <span>Apply Logo Upgrade</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Sub-modal: Camera Capture */}
      {isCameraActive && (
        <CameraCaptureModal
          isOpen={isCameraActive}
          onClose={() => setIsCameraActive(false)}
          onPhotoCaptured={(dataUrl) => {
            setForm((prev) => ({
              ...prev,
              type: 'custom_image',
              imageUrl: dataUrl,
            }));
            addMediaAsset({
              title: 'Camera Logo Snapshot',
              url: dataUrl,
              category: 'profiles',
              source: 'camera',
              description: 'Live camera captured brand logo for Sitara Cloth House',
            });
            setIsCameraActive(false);
          }}
        />
      )}

      {/* Sub-modal: Media Library Selector */}
      {isMediaLibraryActive && (
        <MediaLibraryModal
          isOpen={isMediaLibraryActive}
          onClose={() => setIsMediaLibraryActive(false)}
          onSelectImage={(url) => {
            setForm((prev) => ({
              ...prev,
              type: 'custom_image',
              imageUrl: url,
            }));
            setIsMediaLibraryActive(false);
          }}
        />
      )}
    </div>
  );
};
