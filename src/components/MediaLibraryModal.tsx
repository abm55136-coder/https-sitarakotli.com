import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Camera,
  Image as ImageIcon,
  Search,
  Filter,
  Check,
  Trash2,
  Edit,
  ExternalLink,
  Sparkles,
  Smartphone,
  FolderPlus,
  Layers,
  Copy
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { MediaAsset, MediaCategory } from '../types';
import { filterMediaAssets, formatBytes, validateImageFile } from '../utils/mediaUtils';
import { CameraCaptureModal } from './CameraCaptureModal';
import { ImageEditorModal } from './ImageEditorModal';
import { scanFileWithSecurityWall } from '../services/securityApi';

interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage?: (url: string, asset: MediaAsset) => void;
  activeCategory?: MediaCategory | 'all';
}

export const MediaLibraryModal: React.FC<MediaLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelectImage,
  activeCategory = 'all',
}) => {
  const { mediaLibrary, addMediaAsset, deleteMediaAsset } = useShop();

  const [currentCategory, setCurrentCategory] = useState<MediaCategory | 'all'>(activeCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);

  // Sub-modals
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [assetToEdit, setAssetToEdit] = useState<MediaAsset | null>(null);

  // File picker ref for Android Gallery batch upload
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredAssets = filterMediaAssets(mediaLibrary, currentCategory, searchQuery);

  // Handle batch selection from Android Phone Gallery
  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadError(null);
    setIsUploading(true);

    const fileList = Array.from(files);
    let successCount = 0;

    fileList.forEach((file) => {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setUploadError(validation.error || 'Failed to upload some images.');
        return;
      }

      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          try {
            const scan = await scanFileWithSecurityWall(file, dataUrl);
            if (!scan.safe || scan.blocked) {
              setUploadError(`Blocked by Security Wall (${file.name}): ${scan.threats.join('; ')}`);
              return;
            }
          } catch {
            setUploadError(`Security Wall could not verify "${file.name}".`);
            return;
          }
          const newAsset: MediaAsset = {
            id: `media-custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            title: file.name.replace(/\.[^/.]+$/, ''),
            url: dataUrl,
            category: currentCategory === 'all' ? 'fabrics' : currentCategory,
            source: 'gallery',
            sizeBytes: file.size,
            uploadDate: new Date().toISOString().split('T')[0],
            description: `Verified & imported from Android Gallery (${file.name})`,
            tags: ['android-gallery', currentCategory, 'scanned-clean'],
          };
          addMediaAsset(newAsset);
          successCount++;
        }
      };
      reader.readAsDataURL(file);
    });

    setTimeout(() => {
      setIsUploading(false);
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }, 800);
  };

  const handleCopy = (url: string) => {
    navigator.clipboard?.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleOpenEditor = (asset: MediaAsset) => {
    setAssetToEdit(asset);
    setIsEditorOpen(true);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/95 backdrop-blur-md">
        <div className="relative w-full max-w-5xl bg-stone-900 border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between bg-stone-950">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 text-stone-950 font-bold flex items-center justify-center shadow-md">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif-luxury font-bold text-stone-100 text-lg flex items-center gap-2">
                  <span>Sitara Central Media Hub</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-sans border border-amber-500/30">
                    Awais Malik Portal
                  </span>
                </h3>
                <p className="text-xs text-stone-400">
                  Android Gallery multi-upload & camera management for fabrics, properties & vehicles
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

          {/* Action Bar: Android Gallery + Camera Triggers */}
          <div className="p-4 bg-stone-950/80 border-b border-stone-800/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Trigger Android Phone Gallery Batch Upload */}
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                disabled={isUploading}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
              >
                <Smartphone className="w-4 h-4" />
                <span>Upload From Android Gallery</span>
              </button>

              {/* Hidden file input for multiple image selection */}
              <input
                ref={galleryInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleGalleryUpload}
              />

              {/* Direct Camera Viewfinder */}
              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-500/30 font-semibold text-xs flex items-center gap-2 transition-all"
              >
                <Camera className="w-4 h-4" />
                <span>Open Android Camera</span>
              </button>
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pictures, tags, SKUs..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-200 text-xs focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="px-4 py-2.5 bg-stone-950/40 border-b border-stone-800 flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
            {[
              { id: 'all', label: 'All Pictures', count: mediaLibrary.length },
              { id: 'fabrics', label: '👔 Fabrics', count: mediaLibrary.filter((m) => m.category === 'fabrics').length },
              { id: 'property', label: '🏢 Properties & Shops', count: mediaLibrary.filter((m) => m.category === 'property').length },
              { id: 'vehicles', label: '🚗 Vehicles & Cargo', count: mediaLibrary.filter((m) => m.category === 'vehicles').length },
              { id: 'business', label: '🏛️ Showroom', count: mediaLibrary.filter((m) => m.category === 'business').length },
              { id: 'banners', label: '🌟 Banners', count: mediaLibrary.filter((m) => m.category === 'banners').length },
              { id: 'profiles', label: '👤 Profiles', count: mediaLibrary.filter((m) => m.category === 'profiles').length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCurrentCategory(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  currentCategory === tab.id
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                    : 'bg-stone-800/80 text-stone-300 hover:bg-stone-800'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  currentCategory === tab.id ? 'bg-stone-950/20 text-stone-950' : 'bg-stone-900 text-stone-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Error Banner */}
          {uploadError && (
            <div className="px-4 py-2 bg-rose-500/10 border-b border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
              <span>{uploadError}</span>
              <button onClick={() => setUploadError(null)} className="text-rose-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Assets Grid */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
            {filteredAssets.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-stone-800 text-stone-500 flex items-center justify-center mx-auto border border-stone-700">
                  <ImageIcon className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-stone-300 font-semibold text-sm">No media assets found</h4>
                  <p className="text-stone-500 text-xs mt-1">
                    Upload pictures from your Android phone gallery or snap new ones with the camera.
                  </p>
                </div>
                <div className="flex justify-center gap-2 pt-2">
                  <button
                    onClick={() => galleryInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs flex items-center gap-1.5"
                  >
                    <Smartphone className="w-4 h-4" />
                    Pick from Android Gallery
                  </button>
                  <button
                    onClick={() => setIsCameraOpen(true)}
                    className="px-4 py-2 rounded-xl bg-stone-800 text-stone-200 border border-stone-700 text-xs flex items-center gap-1.5"
                  >
                    <Camera className="w-4 h-4 text-amber-400" />
                    Snap with Camera
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {filteredAssets.map((asset) => {
                  const isSelected = selectedAsset?.id === asset.id;
                  return (
                    <div
                      key={asset.id}
                      className={`group relative bg-stone-950 rounded-2xl overflow-hidden border transition-all flex flex-col ${
                        isSelected
                          ? 'border-amber-400 ring-2 ring-amber-400/40 shadow-xl'
                          : 'border-stone-800 hover:border-amber-500/50'
                      }`}
                    >
                      {/* Image Thumbnail */}
                      <div
                        onClick={() => setSelectedAsset(asset)}
                        className="relative aspect-square w-full cursor-pointer bg-stone-900 overflow-hidden"
                      >
                        <img
                          src={asset.url}
                          alt={asset.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {/* Source Badge */}
                        <div className="absolute top-2 left-2">
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-950/80 backdrop-blur-md text-amber-300 border border-stone-700 uppercase font-semibold">
                            {asset.source}
                          </span>
                        </div>

                        {/* Category Tag */}
                        <div className="absolute bottom-2 left-2">
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-950/80 backdrop-blur-md text-stone-300 border border-stone-800 capitalize">
                            {asset.category}
                          </span>
                        </div>
                      </div>

                      {/* Info & Actions */}
                      <div className="p-2.5 flex-1 flex flex-col justify-between">
                        <div>
                          <h5 className="text-xs font-semibold text-stone-200 truncate" title={asset.title}>
                            {asset.title}
                          </h5>
                          <p className="text-[10px] text-stone-500 mt-0.5">
                            {asset.sizeBytes ? formatBytes(asset.sizeBytes) : 'HD'} • {asset.uploadDate}
                          </p>
                        </div>

                        <div className="flex items-center justify-between gap-1 mt-2.5 pt-2 border-t border-stone-800/80">
                          {/* Choose for Listing button */}
                          {onSelectImage ? (
                            <button
                              type="button"
                              onClick={() => {
                                onSelectImage(asset.url, asset);
                                onClose();
                              }}
                              className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-semibold flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              <span>Select</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleCopy(asset.url)}
                              className="p-1.5 rounded-lg text-stone-400 hover:text-amber-300 hover:bg-stone-800"
                              title="Copy Image URL"
                            >
                              {copiedUrl === asset.url ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditor(asset)}
                              className="p-1.5 rounded-lg text-stone-400 hover:text-amber-300 hover:bg-stone-800"
                              title="Crop & Edit Image"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteMediaAsset(asset.id)}
                              className="p-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-stone-800"
                              title="Delete from Library"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="p-3 bg-stone-950 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>
                Total Assets: <strong className="text-stone-200">{mediaLibrary.length}</strong> | Filtered:{' '}
                <strong className="text-amber-300">{filteredAssets.length}</strong>
              </span>
            </div>

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold"
            >
              Close Hub
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Modal: Live Android Camera */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        defaultCategory={currentCategory === 'all' ? 'fabrics' : currentCategory}
      />

      {/* Sub-Modal: Photo Studio & Cropper */}
      {assetToEdit && (
        <ImageEditorModal
          isOpen={isEditorOpen}
          imageUrl={assetToEdit.url}
          initialTitle={assetToEdit.title}
          initialCategory={assetToEdit.category}
          onClose={() => {
            setIsEditorOpen(false);
            setAssetToEdit(null);
          }}
          onSave={(editedUrl, meta) => {
            // Update asset in place or as new
            addMediaAsset({
              title: meta.title,
              url: editedUrl,
              category: meta.category,
              source: 'upload',
              uploadDate: new Date().toISOString().split('T')[0],
              description: meta.description,
              tags: [meta.category, 'edited'],
            });
          }}
        />
      )}
    </>
  );
};
