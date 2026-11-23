import React, { useState, useRef, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { THEME_PRESETS } from '../data/initialData';
import { ThemeId } from '../types';
import { Palette, Check, ChevronDown, Sparkles } from 'lucide-react';

interface ThemeSelectorProps {
  variant?: 'compact' | 'expanded' | 'admin';
  className?: string;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ variant = 'compact', className = '' }) => {
  const { currentTheme, setTheme, lang } = useShop();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const activePreset = THEME_PRESETS.find((p) => p.id === currentTheme) || THEME_PRESETS[0];

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. Admin Full View / Settings Panel
  if (variant === 'admin' || variant === 'expanded') {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-amber-400" />
            <h4 className="text-sm font-bold text-white">Store Luxury Themes & Palettes</h4>
          </div>
          <span className="text-xs text-stone-400">
            Active: <strong className="text-amber-300">{activePreset.name}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {THEME_PRESETS.map((preset) => {
            const isSelected = preset.id === currentTheme;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setTheme(preset.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'border-amber-400 ring-2 ring-amber-400/30 bg-stone-900 shadow-xl'
                    : 'border-stone-800 bg-stone-950/60 hover:bg-stone-900 hover:border-stone-700'
                }`}
              >
                {/* 3-color palette swatch preview */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 p-1 rounded-full bg-black/40 border border-white/10">
                    {preset.previewColors.map((color, i) => (
                      <span
                        key={i}
                        className="w-4 h-4 rounded-full border border-white/20"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      isSelected
                        ? 'bg-amber-400 text-stone-950'
                        : 'bg-stone-800 text-stone-400'
                    }`}
                  >
                    {preset.badge}
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-100">{preset.name}</span>
                    {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                  </div>
                  <p className="text-[11px] text-amber-300/80 font-urdu mt-0.5" dir="rtl">
                    {preset.nameUrdu}
                  </p>
                  <p className="text-[11px] text-stone-400 mt-1 line-clamp-2 leading-relaxed">
                    {preset.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // 2. Compact Dropdown for Navbar
  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-2.5 py-1 rounded-full bg-stone-900/90 border border-amber-900/40 text-stone-300 hover:text-amber-300 hover:border-amber-500/50 text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm"
        title="Change Website Theme"
        aria-label="Change Website Theme"
      >
        <Palette className="w-3.5 h-3.5 text-amber-400" />
        <span className="hidden xl:inline text-[11px] font-semibold">{activePreset.name.split(' ')[0]}</span>
        <div className="flex items-center -space-x-1">
          {activePreset.previewColors.slice(0, 2).map((col, i) => (
            <span
              key={i}
              className="w-2.5 h-2.5 rounded-full border border-stone-900"
              style={{ backgroundColor: col }}
            />
          ))}
        </div>
        <ChevronDown className="w-3 h-3 text-stone-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-stone-950 border border-amber-500/30 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-2 border-b border-stone-800 flex items-center justify-between text-xs">
            <span className="font-bold text-stone-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{lang === 'ur' ? 'تھیم کا انتخاب' : 'Select Theme'}</span>
            </span>
            <span className="text-[10px] text-amber-400/80 font-medium">6 Luxury Palettes</span>
          </div>

          <div className="space-y-1 mt-1 max-h-80 overflow-y-auto">
            {THEME_PRESETS.map((preset) => {
              const isSelected = preset.id === currentTheme;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setTheme(preset.id);
                    setIsOpen(false);
                  }}
                  className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-2 transition-all ${
                    isSelected
                      ? 'bg-amber-500/15 border border-amber-500/40 text-white'
                      : 'hover:bg-stone-900 text-stone-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex items-center gap-1 p-0.5 rounded-full bg-stone-900 border border-stone-800 shrink-0">
                      {preset.previewColors.map((color, i) => (
                        <span
                          key={i}
                          className="w-3 h-3 rounded-full border border-stone-950"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate text-stone-200">
                        {preset.name}
                      </div>
                      <div className="text-[10px] text-amber-400/80 font-urdu" dir="rtl">
                        {preset.nameUrdu}
                      </div>
                    </div>
                  </div>

                  {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
