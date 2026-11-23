import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  X,
  RefreshCw,
  Grid,
  Check,
  AlertCircle,
  Sparkles,
  Smartphone,
  Trash2,
  FolderOpen
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { MediaCategory } from '../types';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoCaptured?: (imageUrl: string, metadata: { title: string; category: MediaCategory }) => void;
  defaultCategory?: MediaCategory;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onPhotoCaptured,
  defaultCategory = 'fabrics',
}) => {
  const { addMediaAsset } = useShop();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fallbackInputRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isStreaming, setIsStreaming] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [isFlashing, setIsFlashing] = useState(false);
  const [photoTitle, setPhotoTitle] = useState('');
  const [category, setCategory] = useState<MediaCategory>(defaultCategory);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Initialize camera stream
  const startCamera = async (facing: 'environment' | 'user') => {
    try {
      setPermissionError(null);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser. Please use native phone picker below.');
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.play();
      }
      setIsStreaming(true);
    } catch (err: any) {
      console.warn('Camera access failed, falling back:', err);
      setIsStreaming(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionError('Camera permission was denied. Tap below to use Android Native Camera or grant permission.');
      } else {
        setPermissionError(err.message || 'Unable to access Android camera hardware. Use fallback capture.');
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode);
    } else {
      // Clean up stream
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
      setIsStreaming(false);
      setSelectedPhoto(null);
      setSavedSuccess(false);
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen]);

  const toggleCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const playShutterSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.09);
    } catch {
      // Audio not permitted or supported
    }
  };

  const takeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flash effect & shutter sound
    setIsFlashing(true);
    playShutterSound();
    setTimeout(() => setIsFlashing(false), 150);

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    setCapturedPhotos((prev) => [dataUrl, ...prev]);
    setSelectedPhoto(dataUrl);
    setPhotoTitle(`Sitara Snap ${new Date().toLocaleTimeString('en-US', { hour12: false })}`);
  };

  // Fallback for native Android Camera file picker
  const handleNativeCameraFallback = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setCapturedPhotos((prev) => [dataUrl, ...prev]);
        setSelectedPhoto(dataUrl);
        setPhotoTitle(file.name.replace(/\.[^/.]+$/, '') || 'Android Camera Shot');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhoto = () => {
    if (!selectedPhoto) return;

    const finalTitle = photoTitle.trim() || `Android Camera Upload (${category})`;
    addMediaAsset({
      title: finalTitle,
      url: selectedPhoto,
      category,
      source: 'camera',
      uploadDate: new Date().toISOString().split('T')[0],
      description: `Captured via Android Camera Studio for Sitara Cloth House [${category.toUpperCase()}].`,
      tags: [category, 'android-camera', 'hd'],
    });

    if (onPhotoCaptured) {
      onPhotoCaptured(selectedPhoto, { title: finalTitle, category });
    }

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/95 backdrop-blur-md">
      <div className="relative w-full max-w-4xl bg-stone-900 border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh]">
        {/* Header */}
        <div className="p-4 border-b border-stone-800 flex items-center justify-between bg-stone-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif-luxury font-bold text-stone-100 text-lg flex items-center gap-2">
                <span>Android Camera Studio</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-sans">
                  Live Viewfinder
                </span>
              </h3>
              <p className="text-xs text-stone-400">
                Snap high-definition pictures of fabrics, properties, and vehicles
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

        {/* Viewfinder / Main Area */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center">
          <div className="relative w-full max-w-2xl aspect-[4/3] bg-black rounded-2xl overflow-hidden border border-amber-500/30 shadow-inner flex items-center justify-center">
            {/* Live Video */}
            <video
              ref={videoRef}
              playsInline
              muted
              className={`w-full h-full object-cover ${!isStreaming ? 'hidden' : ''}`}
            />

            {/* Flash Effect */}
            {isFlashing && (
              <div className="absolute inset-0 bg-white z-30 pointer-events-none animate-pulse" />
            )}

            {/* 3x3 Composition Grid */}
            {showGrid && isStreaming && (
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none z-10 border border-amber-400/20">
                <div className="border-r border-b border-amber-400/20" />
                <div className="border-r border-b border-amber-400/20" />
                <div className="border-b border-amber-400/20" />
                <div className="border-r border-b border-amber-400/20" />
                <div className="border-r border-b border-amber-400/20" />
                <div className="border-b border-amber-400/20" />
                <div className="border-r border-amber-400/20" />
                <div className="border-r border-amber-400/20" />
                <div />
              </div>
            )}

            {/* Live Camera Watermark */}
            {isStreaming && (
              <div className="absolute top-3 left-3 z-20 flex items-center gap-2 bg-stone-950/80 backdrop-blur-md px-3 py-1 rounded-full border border-stone-700/60 text-[11px] text-stone-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Sitara HD Camera • {facingMode === 'environment' ? 'Rear Lens' : 'Front Lens'}</span>
              </div>
            )}

            {/* Permission or Error Fallback */}
            {!isStreaming && (
              <div className="p-6 text-center max-w-md space-y-4">
                <div className="w-14 h-14 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
                  <Smartphone className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-stone-200 font-semibold text-base mb-1">Android Direct Camera Access</h4>
                  <p className="text-stone-400 text-xs">
                    {permissionError || 'Requesting camera stream. If blocked inside browser frame, use the direct native Android Camera launcher below.'}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                  <button
                    onClick={() => startCamera(facingMode)}
                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retry Camera Stream
                  </button>

                  <button
                    onClick={() => fallbackInputRef.current?.click()}
                    className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-500/30 font-semibold text-xs flex items-center justify-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    Launch Android Camera App
                  </button>
                </div>
              </div>
            )}

            {/* Hidden fallback file input with capture="environment" for native phone camera */}
            <input
              type="file"
              ref={fallbackInputRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleNativeCameraFallback}
            />

            {/* Hidden canvas for snapshot rendering */}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Viewfinder Controls */}
          {isStreaming && (
            <div className="flex items-center gap-4 mt-4">
              <button
                type="button"
                onClick={() => setShowGrid(!showGrid)}
                className={`p-3 rounded-full border transition-colors ${
                  showGrid
                    ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                    : 'bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200'
                }`}
                title="Toggle Composition Grid"
              >
                <Grid className="w-5 h-5" />
              </button>

              {/* Shutter Button */}
              <button
                type="button"
                onClick={takeSnapshot}
                className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 p-1 shadow-lg shadow-amber-500/30 active:scale-95 transition-transform flex items-center justify-center"
                title="Capture Picture"
              >
                <div className="w-full h-full rounded-full border-4 border-stone-900 bg-amber-100 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-stone-950" />
                </div>
              </button>

              <button
                type="button"
                onClick={toggleCamera}
                className="p-3 rounded-full bg-stone-800 border border-stone-700 text-stone-300 hover:text-amber-400 hover:border-amber-500/40 transition-colors"
                title="Switch Front/Back Lens"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Captured Photos Strip */}
          {capturedPhotos.length > 0 && (
            <div className="w-full max-w-2xl mt-4 bg-stone-950/60 p-3 rounded-2xl border border-stone-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-stone-300 font-medium flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Captured Snaps ({capturedPhotos.length})
                </span>
                <span className="text-[11px] text-amber-400/80">Tap any thumbnail to preview or save</span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {capturedPhotos.map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedPhoto(photo);
                      setPhotoTitle(`Sitara Snap ${index + 1}`);
                    }}
                    className={`relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                      selectedPhoto === photo
                        ? 'border-amber-400 scale-105 shadow-md shadow-amber-500/20'
                        : 'border-stone-700 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={photo} alt={`Snap ${index}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selected Photo Meta & Save Controls */}
          {selectedPhoto && (
            <div className="w-full max-w-2xl mt-4 p-4 rounded-2xl bg-stone-950 border border-amber-500/30 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedPhoto}
                    alt="Selected snap preview"
                    className="w-14 h-14 rounded-xl object-cover border border-amber-500/40"
                  />
                  <div>
                    <h5 className="text-xs font-semibold text-stone-200">Active Snapshot for Upload</h5>
                    <p className="text-[11px] text-stone-400">Ready to save into Sitara Media Gallery & Listing</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setCapturedPhotos((prev) => prev.filter((p) => p !== selectedPhoto));
                    setSelectedPhoto(capturedPhotos.find((p) => p !== selectedPhoto) || null);
                  }}
                  className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 text-xs flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Discard</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-medium text-stone-400 mb-1">Picture Title / Label</label>
                  <input
                    type="text"
                    value={photoTitle}
                    onChange={(e) => setPhotoTitle(e.target.value)}
                    placeholder="e.g. Pure Boski Roll Showroom View"
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-stone-400 mb-1">Target Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as MediaCategory)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:outline-none focus:border-amber-400"
                  >
                    <option value="fabrics">👔 Fabrics & Clothing</option>
                    <option value="property">🏢 Properties, Shops & Plazas</option>
                    <option value="vehicles">🚗 Cars, Bikes & Delivery Logistics</option>
                    <option value="business">🏛️ Showroom & Store Business</option>
                    <option value="banners">🌟 Promotional Banners</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                {savedSuccess ? (
                  <div className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Saved to Media Library!
                  </div>
                ) : (
                  <button
                    onClick={handleSavePhoto}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20"
                  >
                    <Check className="w-4 h-4" />
                    Save Captured Picture
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
