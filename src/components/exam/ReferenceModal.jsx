import React from 'react';
import { X } from 'lucide-react';

export default function ReferenceModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs select-none"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-4xl rounded-2xl border border-slate-300 shadow-2xl flex flex-col overflow-hidden animate-fadeIn text-black font-serif"
      >
        {/* Header tinh giản */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <span className="font-sans font-bold text-xs tracking-wide text-slate-700 uppercase">
            SAT Math Reference Sheet
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-slate-200 text-slate-400 hover:text-black rounded-lg transition"
            title="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nội dung nhỏ gọn - Vừa khít màn hình */}
        <div className="p-5 md:p-6 bg-white space-y-4">
          
          {/* HÀNG 1: 6 HÌNH 2D (CỐ ĐỊNH 6 CỘT) */}
          <div className="grid grid-cols-6 gap-2 items-end text-center">
            {/* 1. Circle */}
            <div className="flex flex-col items-center justify-end">
              <svg width="48" height="48" viewBox="0 0 100 100" className="stroke-black fill-none mb-1.5 overflow-visible">
                <circle cx="50" cy="50" r="42" strokeWidth="2.5" />
                <line x1="50" y1="50" x2="92" y2="50" strokeWidth="2" />
                <circle cx="50" cy="50" r="3.5" fill="black" />
                <text x="68" y="44" className="text-[16px] italic fill-black font-serif">r</text>
              </svg>
              <div className="text-[11px] leading-tight font-serif italic text-slate-900">
                <div>A = πr²</div>
                <div>C = 2πr</div>
              </div>
            </div>

            {/* 2. Rectangle */}
            <div className="flex flex-col items-center justify-end">
              <svg width="60" height="42" viewBox="0 0 110 75" className="stroke-black fill-none mb-2 overflow-visible">
                <rect x="15" y="18" width="75" height="44" strokeWidth="2.5" />
                <text x="48" y="12" className="text-[16px] italic fill-black font-serif">ℓ</text>
                <text x="96" y="46" className="text-[16px] italic fill-black font-serif">w</text>
              </svg>
              <div className="text-[11px] font-serif italic text-slate-900">
                A = ℓw
              </div>
            </div>

            {/* 3. Triangle */}
            <div className="flex flex-col items-center justify-end">
              <svg width="58" height="48" viewBox="0 0 110 90" className="stroke-black fill-none mb-1.5 overflow-visible">
                <polygon points="12,75 98,75 52,15" strokeWidth="2.5" />
                <line x1="52" y1="15" x2="52" y2="75" strokeWidth="1.8" strokeDasharray="3 3" />
                <rect x="52" y="67" width="8" height="8" strokeWidth="1.5" />
                <text x="50" y="89" className="text-[15px] italic fill-black font-serif">b</text>
                <text x="58" y="48" className="text-[15px] italic fill-black font-serif">h</text>
              </svg>
              <div className="text-[11px] font-serif italic text-slate-900">
                A = ½bh
              </div>
            </div>

            {/* 4. Pythagoras */}
            <div className="flex flex-col items-center justify-end">
              <svg width="58" height="48" viewBox="0 0 110 90" className="stroke-black fill-none mb-1.5 overflow-visible">
                <polygon points="18,72 95,72 18,15" strokeWidth="2.5" />
                <rect x="18" y="62" width="10" height="10" strokeWidth="1.5" />
                <text x="5" y="48" className="text-[15px] italic fill-black font-serif">b</text>
                <text x="52" y="87" className="text-[15px] italic fill-black font-serif">a</text>
                <text x="62" y="40" className="text-[15px] italic fill-black font-serif">c</text>
              </svg>
              <div className="text-[11px] font-serif italic text-slate-900">
                c² = a² + b²
              </div>
            </div>

            {/* 5. Special 30-60-90 */}
            <div className="flex flex-col items-center justify-end">
              <svg width="68" height="48" viewBox="0 0 120 90" className="stroke-black fill-none mb-1 overflow-visible">
                <polygon points="15,75 108,75 15,18" strokeWidth="2.5" />
                <rect x="15" y="67" width="8" height="8" strokeWidth="1.5" />
                <text x="4" y="50" className="text-[14px] fill-black font-serif italic">x</text>
                <text x="54" y="88" className="text-[13px] fill-black font-serif italic">x√3</text>
                <text x="62" y="40" className="text-[14px] fill-black font-serif italic">2x</text>
                <text x="20" y="32" className="text-[11px] font-sans fill-black">60°</text>
                <text x="82" y="70" className="text-[11px] font-sans fill-black">30°</text>
              </svg>
              <div className="text-[10px] font-sans text-slate-600">
                Special Triangles
              </div>
            </div>

            {/* 6. Special 45-45-90 */}
            <div className="flex flex-col items-center justify-end">
              <svg width="56" height="48" viewBox="0 0 100 90" className="stroke-black fill-none mb-1 overflow-visible">
                <polygon points="18,74 82,74 18,12" strokeWidth="2.5" />
                <rect x="18" y="66" width="8" height="8" strokeWidth="1.5" />
                <text x="6" y="48" className="text-[14px] fill-black font-serif italic">s</text>
                <text x="46" y="88" className="text-[14px] fill-black font-serif italic">s</text>
                <text x="54" y="38" className="text-[13px] fill-black font-serif italic">s√2</text>
                <text x="22" y="28" className="text-[11px] font-sans fill-black">45°</text>
                <text x="65" y="68" className="text-[11px] font-sans fill-black">45°</text>
              </svg>
              <div className="text-[10px] font-sans text-slate-600">
                &nbsp;
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 my-1"></div>

          {/* HÀNG 2: 5 KHỐI 3D (CỐ ĐỊNH 5 CỘT) */}
          <div className="grid grid-cols-5 gap-2 items-end text-center">
            {/* 1. Box */}
            <div className="flex flex-col items-center justify-end">
              <svg width="60" height="44" viewBox="0 0 120 90" className="stroke-black fill-none mb-1.5 overflow-visible">
                <polygon points="15,40 85,40 85,75 15,75" strokeWidth="2.3" />
                <polygon points="15,40 40,18 110,18 85,40" strokeWidth="2.3" />
                <polygon points="85,40 110,18 110,53 85,75" strokeWidth="2.3" />
                <text x="48" y="90" className="text-[15px] italic fill-black font-serif">ℓ</text>
                <text x="98" y="70" className="text-[15px] italic fill-black font-serif">w</text>
                <text x="116" y="38" className="text-[15px] italic fill-black font-serif">h</text>
              </svg>
              <div className="text-[11px] font-serif italic text-slate-900">
                V = ℓwh
              </div>
            </div>

            {/* 2. Cylinder */}
            <div className="flex flex-col items-center justify-end">
              <svg width="52" height="46" viewBox="0 0 100 90" className="stroke-black fill-none mb-1.5 overflow-visible">
                <ellipse cx="50" cy="22" rx="32" ry="11" strokeWidth="2.3" />
                <line x1="18" y1="22" x2="18" y2="68" strokeWidth="2.3" />
                <line x1="82" y1="22" x2="82" y2="68" strokeWidth="2.3" />
                <path d="M 18,68 A 32,11 0 0,0 82,68" strokeWidth="2.3" />
                <line x1="50" y1="22" x2="80" y2="22" strokeWidth="1.8" />
                <circle cx="50" cy="22" r="3" fill="black" />
                <text x="65" y="16" className="text-[14px] italic fill-black font-serif">r</text>
                <text x="88" y="48" className="text-[14px] italic fill-black font-serif">h</text>
              </svg>
              <div className="text-[11px] font-serif italic text-slate-900">
                V = πr²h
              </div>
            </div>

            {/* 3. Sphere */}
            <div className="flex flex-col items-center justify-end">
              <svg width="48" height="46" viewBox="0 0 100 90" className="stroke-black fill-none mb-1.5 overflow-visible">
                <circle cx="50" cy="45" r="36" strokeWidth="2.3" />
                <ellipse cx="50" cy="45" rx="36" ry="11" strokeWidth="1.6" strokeDasharray="3 3" />
                <line x1="50" y1="45" x2="86" y2="45" strokeWidth="1.8" />
                <circle cx="50" cy="45" r="3" fill="black" />
                <text x="66" y="40" className="text-[14px] italic fill-black font-serif">r</text>
              </svg>
              <div className="text-[11px] font-serif italic text-slate-900">
                V = ⁴⁄₃πr³
              </div>
            </div>

            {/* 4. Cone */}
            <div className="flex flex-col items-center justify-end">
              <svg width="50" height="46" viewBox="0 0 100 90" className="stroke-black fill-none mb-1.5 overflow-visible">
                <line x1="16" y1="68" x2="50" y2="12" strokeWidth="2.3" />
                <line x1="84" y1="68" x2="50" y2="12" strokeWidth="2.3" />
                <ellipse cx="50" cy="68" rx="34" ry="9" strokeWidth="2.3" />
                <line x1="50" y1="12" x2="50" y2="68" strokeWidth="1.6" strokeDasharray="3 3" />
                <line x1="50" y1="68" x2="84" y2="68" strokeWidth="1.6" strokeDasharray="3 3" />
                <rect x="50" y="61" width="7" height="7" strokeWidth="1.4" />
                <text x="65" y="64" className="text-[14px] italic fill-black font-serif">r</text>
                <text x="54" y="42" className="text-[14px] italic fill-black font-serif">h</text>
              </svg>
              <div className="text-[11px] font-serif italic text-slate-900">
                V = ⅓πr²h
              </div>
            </div>

            {/* 5. Pyramid */}
            <div className="flex flex-col items-center justify-end">
              <svg width="58" height="46" viewBox="0 0 110 90" className="stroke-black fill-none mb-1.5 overflow-visible">
                <polygon points="12,68 85,68 56,12" strokeWidth="2.3" />
                <polygon points="85,68 104,46 56,12" strokeWidth="2.3" />
                <line x1="56" y1="12" x2="56" y2="60" strokeWidth="1.6" strokeDasharray="3 3" />
                <rect x="56" y="54" width="6" height="6" strokeWidth="1.4" />
                <text x="46" y="80" className="text-[14px] italic fill-black font-serif">ℓ</text>
                <text x="98" y="60" className="text-[14px] italic fill-black font-serif">w</text>
                <text x="50" y="38" className="text-[14px] italic fill-black font-serif">h</text>
              </svg>
              <div className="text-[11px] font-serif italic text-slate-900">
                V = ⅓ℓwh
              </div>
            </div>
          </div>

          {/* DÒNG GHI CHÚ DƯỚI CÙNG (GỌN GÀNG) */}
          <div className="pt-2 border-t border-slate-200 text-slate-800 text-[11px] font-sans leading-relaxed space-y-0.5">
            <p>The number of degrees of arc in a circle is 360.</p>
            <p>The number of radians of arc in a circle is 2π.</p>
            <p>The sum of the measures in degrees of the angles of a triangle is 180.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-2 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-black text-white font-sans font-bold text-xs rounded-lg transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}