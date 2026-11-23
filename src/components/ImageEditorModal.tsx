import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  Crop,
  Check,
  Sun,
  Sliders,
  Image as ImageIcon,
  Tag,
  Undo
} from 'lucide-react';
import { MediaCategory } from '../types';
import { useShop } from '../context/ShopContext';
import { rotateAngle, computeCroppedDimensions } from '../utils/mediaUtils';

interface ImageEditorModalProps {
  isOpen: boolean;
  imageUrl: string;
  onClose: () => void;
  onSave: (editedDataUrl: string, metadata: { title: string; category: MediaCategory; description?: string }) => void;
  initialTitle?: string;
  initialCategory?: MediaCategory;
}

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({
  isOpen,
  imageUrl,
  onClose,
  onSave,
  initialTitle = 'Edited Picture',
  initialCategory = 'fabrics',
}) => {
  const { addMediaAsset } = useShop();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [rotation, setRotation] = useState<number>(0);
  const [isFlippedH, setIsFlippedH] = useState<boolean>(false);
  const [aspectRatio, setAspectRatio] = useState<'free' | '1:1' | '4:5' | '16:9'>('free');
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);

  const [title, setTitle] = useState(initialTitle);
  const [category, setCategory] = useState<MediaCategory>(initialCategory);
  const [description, setDescription] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string>(imageUrl);

  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle);
      setCategory(initialCategory);
      setRotation(0);
      setIsFlippedH(false);
      setAspectRatio('free');
      setBrightness(100);
      setContrast(100);
      setPreviewUrl(imageUrl);
    }
  }, [isOpen, imageUrl, initialTitle, initialCategory]);

  // Re-render canvas whenever transforms change
  useEffect(() => {
    if (!isOpen || !imageUrl) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Calculate cropped crop coordinates
      const crop = computeCroppedDimensions(img.width, img.height, aspectRatio);

      // Determine dimensions after rotation
      const isRotatedQuarter = rotation === 90 || rotation === 270;
      canvas.width = isRotatedQuarter ? crop.height : crop.width;
      canvas.height = isRotatedQuarter ? crop.width : crop.height;

      ctx.save();
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

      // Move center of canvas
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(isFlippedH ? -1 : 1, 1);

      // Draw cropped image centered
      ctx.drawImage(
        img,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        -crop.width / 2,
        -crop.height / 2,
        crop.width,
        crop.height
      );

      ctx.restore();

      const updated = canvas.toDataURL('image/jpeg', 0.92);
      setPreviewUrl(updated);
    };
  }, [isOpen, imageUrl, rotation, isFlippedH, aspectRatio, brightness, contrast]);

  const handleRotate = (dir: 'cw' | 'ccw') => {
    setRotation((prev) => rotateAngle(prev, dir));
  };

  const handleReset = () => {
    setRotation(0);
    setIsFlippedH(false);
    setAspectRatio('free');
    setBrightness(100);
    setContrast(100);
  };

  const handleSave = () => {
    const finalDataUrl = previewUrl || imageUrl;
    const finalTitle = title.trim() || 'Edited Sitara Asset';

    addMediaAsset({
      title: finalTitle,
      url: finalDataUrl,
      category,
      source: 'upload',
      uploadDate: new Date().toISOString().split('T')[0],
      description: description.trim() || `Processed in Sitara Studio [Aspect: ${aspectRatio}, Rot: ${rotation}°]`,
      tags: [category, 'studio-edited', aspectRatio],
    });

    onSave(finalDataUrl, { title: finalTitle, category, description });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-950/90 backdrop-blur-md">
      <div className="relative w-full max-w-4xl bg-stone-900 border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="p-4 border-b border-stone-800 flex items-center justify-between bg-stone-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Crop className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif-luxury font-bold text-stone-100 text-lg">
                Photo Studio & Cropper
              </h3>
              <p className="text-xs text-stone-400">
                Rotate, crop, resize & adjust tone before saving to listing
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Preview Canvas Area */}
          <div className="md:col-span-7 flex flex-col items-center justify-center bg-stone-950/80 p-4 rounded-2xl border border-stone-800 min-h-[300px]">
            <div className="relative max-h-[420px] max-w-full overflow-hidden rounded-xl shadow-lg border border-amber-500/20 flex items-center justify-center">
              <img
                src={previewUrl}
                alt="Studio preview"
                className="max-h-[380px] w-auto object-contain rounded-lg"
              />
            </div>
            <canvas ref={canvasRef} className="hidden" />

            {/* Quick Toolbar */}
            <div className="flex items-center gap-2 mt-4 flex-wrap justify-center">
              <button
                type="button"
                onClick={() => handleRotate('ccw')}
                className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs flex items-center gap-1.5"
                title="Rotate 90° Counter-Clockwise"
              >
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span>-90°</span>
              </button>

              <button
                type="button"
                onClick={() => handleRotate('cw')}
                className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs flex items-center gap-1.5"
                title="Rotate 90° Clockwise"
              >
                <RotateCw className="w-4 h-4 text-amber-400" />
                <span>+90°</span>
              </button>

              <button
                type="button"
                onClick={() => setIsFlippedH(!isFlippedH)}
                className={`p-2.5 rounded-xl border text-xs flex items-center gap-1.5 ${
                  isFlippedH
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-stone-800 hover:bg-stone-700 border-stone-700 text-stone-200'
                }`}
                title="Flip Horizontally"
              >
                <FlipHorizontal className="w-4 h-4 text-amber-400" />
                <span>Flip H</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 text-xs flex items-center gap-1.5"
                title="Reset Transformations"
              >
                <Undo className="w-4 h-4 text-stone-400" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Adjustments & Metadata */}
          <div className="md:col-span-5 space-y-4">
            {/* Aspect Ratio Presets */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                <Crop className="w-3.5 h-3.5 text-amber-400" />
                Crop Aspect Ratio
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'free', label: 'Original' },
                  { id: '1:1', label: '1:1 Square' },
                  { id: '4:5', label: '4:5 Portrait' },
                  { id: '16:9', label: '16:9 Wide' },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setAspectRatio(preset.id as any)}
                    className={`py-2 px-1 text-[11px] rounded-xl border font-medium text-center transition-all ${
                      aspectRatio === preset.id
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-stone-800/80 border-stone-700 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Brightness & Contrast */}
            <div className="p-3 bg-stone-950/60 rounded-xl border border-stone-800 space-y-3">
              <div>
                <div className="flex justify-between text-xs text-stone-300 mb-1">
                  <span className="flex items-center gap-1">
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    Brightness
                  </span>
                  <span className="text-stone-400 text-[11px]">{brightness}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-full accent-amber-500 h-1.5 bg-stone-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-stone-300 mb-1">
                  <span className="flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                    Contrast
                  </span>
                  <span className="text-stone-400 text-[11px]">{contrast}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="w-full accent-amber-500 h-1.5 bg-stone-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Metadata inputs */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Picture Title / Name
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Pure Boski Roll 8-Pound"
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-700 text-stone-100 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Category Classification
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as MediaCategory)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-700 text-stone-100 text-xs focus:outline-none focus:border-amber-400"
                >
                  <option value="fabrics">👔 Fabrics & Clothing Collections</option>
                  <option value="property">🏢 Properties, Shops & Plazas</option>
                  <option value="vehicles">🚗 Cars, Bikes & Delivery Logistics</option>
                  <option value="business">🏛️ Showroom & Store Business</option>
                  <option value="banners">🌟 Promotional Banners & Hero Images</option>
                  <option value="profiles">👤 Staff & Admin Profile Photos</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Description / Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details about quality, location, or usage..."
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-700 text-stone-100 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Save Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20"
              >
                <Check className="w-4 h-4" />
                Save & Apply Image
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
