import React, { useMemo, useState } from 'react';
import { QrCode, Copy, Check, Download } from 'lucide-react';
import { generateQrMatrix, renderQrSvgString } from '../utils/qrCode';
import { useShop } from '../context/ShopContext';

interface ProductQrSvgProps {
  sku: string;
  title?: string;
  compact?: boolean;
  sizePx?: number;
}

export const ProductQrSvg: React.FC<ProductQrSvgProps> = ({
  sku,
  title,
  compact = false,
  sizePx = 112,
}) => {
  const { t } = useShop();
  const [copied, setCopied] = useState(false);

  const productShareUrl = useMemo(() => {
    const cleanSku = encodeURIComponent(sku || 'SCH-001');
    return `https://sitarakotli.com/?sku=${cleanSku}`;
  }, [sku]);

  const qrMatrix = useMemo(() => generateQrMatrix(productShareUrl), [productShareUrl]);

  const quiet = 2;
  const viewBoxSize = qrMatrix.size + quiet * 2;

  const handleCopy = async () => {
    try {
      await navigator.clipboard?.writeText(productShareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleDownloadSvg = () => {
    const svgText = renderQrSvgString(productShareUrl, {
      fgColor: '#1c1917',
      bgColor: '#ffffff',
      sizePx: 420,
      quietZone: 4,
    });
    const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sitara-${sku || 'product'}-qr.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const rects = useMemo(() => {
    const items: React.ReactNode[] = [];
    for (let r = 0; r < qrMatrix.size; r++) {
      for (let c = 0; c < qrMatrix.size; c++) {
        if (qrMatrix.modules[r][c]) {
          items.push(<rect key={`${r}-${c}`} x={c + quiet} y={r + quiet} width={1} height={1} />);
        }
      }
    }
    return items;
  }, [qrMatrix]);

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2.5 p-2 rounded-xl bg-stone-950/90 border border-stone-800">
        <div className="p-1.5 rounded-lg bg-white shrink-0 shadow-inner">
          <svg
            viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
            width={sizePx}
            height={sizePx}
            shapeRendering="crispEdges"
            aria-label={`QR Code for ${sku}`}
            role="img"
          >
            <rect width={viewBoxSize} height={viewBoxSize} fill="#ffffff" />
            <g fill="#1c1917">{rects}</g>
          </svg>
        </div>
        <div className="min-w-0 text-left space-y-1">
          <p className="text-[11px] font-bold text-amber-300 font-mono truncate">{sku}</p>
          <p className="text-[10px] text-stone-400 truncate max-w-[160px]">{productShareUrl}</p>
          <div className="flex items-center gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={handleCopy}
              className="px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 text-[10px] font-medium flex items-center gap-1 cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Link'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadSvg}
              className="px-2 py-0.5 rounded bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[10px] font-medium flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3 h-3" />
              <span>SVG</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="product-qr-panel"
      className="p-3.5 rounded-2xl bg-stone-950/90 border border-amber-500/25 flex flex-col sm:flex-row items-center gap-4"
    >
      <div className="p-2 rounded-xl bg-white shadow-lg shrink-0 border border-amber-400/40">
        <svg
          viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
          width={sizePx}
          height={sizePx}
          shapeRendering="crispEdges"
          aria-label={`Product QR Verification for ${title || sku}`}
          role="img"
        >
          <rect width={viewBoxSize} height={viewBoxSize} fill="#ffffff" />
          <g fill="#1c1917">{rects}</g>
        </svg>
      </div>

      <div className="flex-1 min-w-0 text-center sm:text-left space-y-1.5">
        <div className="flex items-center justify-center sm:justify-start gap-1.5 text-amber-300 text-xs font-bold uppercase tracking-wider">
          <QrCode className="w-3.5 h-3.5 text-amber-400" />
          <span>{t.qrCodeHeading}</span>
        </div>
        <p className="text-[11px] text-stone-300 leading-relaxed">{t.qrCodeSub}</p>
        <p className="text-[11px] font-mono text-amber-400/90 truncate">{productShareUrl}</p>

        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
            <span>{copied ? 'Copied URL' : t.copyShareLink}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadSvg}
            className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.downloadQrSvg}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
