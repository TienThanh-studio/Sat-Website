// src/components/exam/DesmosModal.jsx
import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  ArrowLeftRight,
  Zap,
  PlusCircle,
  Sparkles,
  CheckCircle2,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';
import {
  DESMOS_PRESET_CATEGORIES,
  DESMOS_PRESETS,
} from '../../data/desmosPresets';

export default function DesmosModal({
  isOpen,
  onClose,
  initialExpressions = null,
  onWidthChange,
}) {
  const containerRef = useRef(null);
  const calculatorRef = useRef(null);

  const [dockSide, setDockSide] = useState('right');
  const [panelWidth, setPanelWidth] = useState(() =>
    Math.max(360, Math.round(window.innerWidth * 0.48))
  );
  const isResizingRef = useRef(false);

  // State cho thanh trượt "SAT Math Hacks & Presets"
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [presetToast, setPresetToast] = useState(null);

  const triggerPresetToast = (msg) => {
    setPresetToast(String(msg || '').normalize('NFC'));
    setTimeout(() => {
      setPresetToast(null);
    }, 2400);
  };

  useEffect(() => {
    if (typeof onWidthChange === 'function' && isOpen) {
      onWidthChange(panelWidth);
    }
  }, [panelWidth, isOpen, onWidthChange]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizingRef.current) return;
      const newW =
        dockSide === 'right' ? window.innerWidth - e.clientX : e.clientX;
      if (newW >= 340 && newW <= window.innerWidth * 0.85) {
        setPanelWidth(newW);
        if (typeof onWidthChange === 'function') {
          onWidthChange(newW);
        }
      }
    };

    const handleMouseUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
        document.body.style.cursor = 'default';
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dockSide, onWidthChange]);

  useEffect(() => {
    if (!isOpen) return;
    let checkTimer = null;

    const initCalculator = () => {
      if (!containerRef.current || !window.Desmos) return;

      if (!calculatorRef.current) {
        calculatorRef.current = window.Desmos.GraphingCalculator(
          containerRef.current,
          {
            keypad: true,
            expressions: true,
            settingsMenu: true,
            zoomButtons: true,
            expressionsTopbar: true,
            border: false,
            autosize: true,
          }
        );
      }

      if (Array.isArray(initialExpressions) && initialExpressions.length > 0) {
        calculatorRef.current.setBlank();
        initialExpressions.forEach((exp, idx) => {
          calculatorRef.current.setExpression({
            id: exp.id || `init_${idx}`,
            latex: exp.latex,
          });
        });
      }

      setTimeout(() => {
        calculatorRef.current?.resize();
      }, 50);
    };

    if (window.Desmos) {
      initCalculator();
    } else {
      const existingScript = document.querySelector(
        'script[src*="desmos.com/api"]'
      );
      if (!existingScript) {
        const script = document.createElement('script');
        script.src =
          'https://www.desmos.com/api/v1.9/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6';
        script.async = true;
        script.onload = initCalculator;
        document.body.appendChild(script);
      } else {
        checkTimer = setInterval(() => {
          if (window.Desmos) {
            clearInterval(checkTimer);
            initCalculator();
          }
        }, 150);
      }
    }

    return () => {
      if (checkTimer) clearInterval(checkTimer);
    };
  }, [isOpen, initialExpressions]);

  useEffect(() => {
    if (isOpen && calculatorRef.current) {
      const t = setTimeout(() => calculatorRef.current?.resize(), 40);
      return () => clearTimeout(t);
    }
  }, [isOpen, panelWidth, dockSide]);

  const handleClear = () => {
    if (calculatorRef.current) {
      calculatorRef.current.setBlank();
      triggerPresetToast('Đã xóa trắng bảng biểu thức.');
    }
  };

  const handleReset = () => {
    if (calculatorRef.current) {
      calculatorRef.current.setBlank();
      calculatorRef.current.setMathBounds({
        left: -10,
        right: 10,
        bottom: -10,
        top: 10,
      });
      triggerPresetToast('Đã đặt lại hệ trục tọa độ [-10, 10].');
    }
  };

  // Nạp bộ biểu thức Preset vào Desmos:
  // - mode = 'insert': chèn trực tiếp vào bảng hiện tại mà không làm mất công thức đang gõ
  // - mode = 'new_canvas': xóa trắng máy tính, căn chỉnh MathBounds tối ưu và nạp bộ mẫu mới
  const handleApplyPreset = (preset, mode = 'insert') => {
    if (!calculatorRef.current || !preset) return;

    const calc = calculatorRef.current;

    if (mode === 'new_canvas') {
      calc.setBlank();
      if (preset.bounds) {
        calc.setMathBounds(preset.bounds);
      } else {
        calc.setMathBounds({ left: -10, right: 10, bottom: -10, top: 10 });
      }
    }

    const suffix = mode === 'insert' ? `_${Date.now().toString().slice(-4)}` : '';

    (preset.expressions || []).forEach((exp, idx) => {
      const expId = `${exp.id || `sat_exp_${idx}`}${suffix}`;

      if (exp.type === 'table' && Array.isArray(exp.columns)) {
        calc.setExpression({
          type: 'table',
          id: expId,
          columns: exp.columns.map((col) => ({
            latex: col.latex,
            values: Array.isArray(col.values) ? col.values : [],
          })),
        });
      } else {
        const payload = {
          id: expId,
          latex: exp.latex,
        };
        if (exp.color) payload.color = exp.color;
        if (exp.sliderBounds) payload.sliderBounds = exp.sliderBounds;
        if (exp.label) payload.label = String(exp.label).normalize('NFC');
        if (typeof exp.showLabel === 'boolean') payload.showLabel = exp.showLabel;
        if (exp.lineStyle && window.Desmos?.Styles?.[exp.lineStyle]) {
          payload.lineStyle = window.Desmos.Styles[exp.lineStyle];
        }
        calc.setExpression(payload);
      }
    });

    setIsPresetsOpen(false);
    triggerPresetToast(
      mode === 'new_canvas'
        ? `Đã mở bảng trắng & nạp: ${preset.title}`
        : `Đã chèn thêm công thức: ${preset.title}`
    );
  };

  if (!isOpen) return null;

  const filteredPresets =
    activeCategory === 'all'
      ? DESMOS_PRESETS
      : DESMOS_PRESETS.filter((p) => p.category === activeCategory);

  return (
    <div
      style={{ width: `${panelWidth}px` }}
      className={`fixed inset-y-0 ${
        dockSide === 'right' ? 'right-0 border-l-2' : 'left-0 border-r-2'
      } z-50 bg-white/95 backdrop-blur-md border-white/10 ring-1 ring-[#2568a9] shadow-2xl flex flex-col select-none font-sans`}
    >
      {/* Thanh kéo đổi chiều ngang (Resizer) */}
      <div
        onMouseDown={(e) => {
          e.preventDefault();
          isResizingRef.current = true;
          document.body.style.cursor = 'col-resize';
        }}
        title={'Kéo sang trái/phải để thay đổi chiều ngang máy tính'.normalize('NFC')}
        className={`absolute top-0 bottom-0 ${
          dockSide === 'right' ? '-left-2' : '-right-2'
        } w-4 cursor-col-resize z-50 flex items-center justify-center group`}
      >
        <div className="w-1.5 h-12 rounded-full bg-slate-400/60 group-hover:bg-[#2568a9] transition-colors shadow" />
      </div>

      {/* HEADER THANH CÔNG CỤ DESMOS */}
      <div className="h-14 px-3.5 bg-[#2568a9]/95 backdrop-blur-md text-white flex items-center justify-between shrink-0 border-b border-white/10 relative z-30">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-sm sm:text-base tracking-tight">
            Desmos Graphing
          </span>
          <button
            type="button"
            onClick={() =>
              setDockSide((prev) => (prev === 'right' ? 'left' : 'right'))
            }
            className="px-2 py-1 rounded bg-white/15 hover:bg-white/25 border border-white/25 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
          >
            <ArrowLeftRight className="w-3 h-3" />
            <span className="hidden sm:inline">
              {(dockSide === 'right' ? 'Sang trái' : 'Sang phải').normalize('NFC')}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {/* NÚT ⚡ SAT HACKS & PRESETS */}
          <button
            type="button"
            onClick={() => setIsPresetsOpen((prev) => !prev)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
              isPresetsOpen
                ? 'bg-amber-400 text-slate-950 border-amber-200 shadow-md'
                : 'bg-amber-400/90 hover:bg-amber-300 text-slate-950 border-amber-200/70'
            }`}
            title={'Mở thư viện biểu thức mẫu giải nhanh SAT Math 750–800'.normalize('NFC')}
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>{'⚡ SAT Hacks & Presets'.normalize('NFC')}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isPresetsOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          <button
            type="button"
            onClick={handleClear}
            className="px-2.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 border border-white/30 text-white text-xs font-medium transition cursor-pointer"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-2.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 border border-white/30 text-white text-xs font-medium transition cursor-pointer hidden sm:inline-flex"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={onClose}
            className="ml-0.5 w-8 h-7 rounded-lg bg-[#d93848] hover:bg-[#b82836] border border-red-300/40 text-white flex items-center justify-center transition cursor-pointer shadow-xs"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* TOAST THÔNG BÁO KHI NẠP CÔNG THỨC */}
      {presetToast && (
        <div className="bg-emerald-600 text-white px-4 py-1.5 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md z-30">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{presetToast}</span>
        </div>
      )}

      {/* FLYOUT DRAWER: THƯ VIỆN BIỂU THỨC MẪU SAT MATH HACKS & PRESETS */}
      {isPresetsOpen && (
        <div className="absolute top-14 inset-x-0 bottom-0 z-40 bg-slate-950/92 backdrop-blur-xl text-slate-100 flex flex-col overflow-hidden border-t border-cyan-400/30 animate-in fade-in duration-150">
          {/* Header Drawer & Bộ lọc Chủ đề */}
          <div className="p-4 bg-slate-900/95 border-b border-white/10 space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                  <Sparkles className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-white">
                    {'Thư Viện Thủ Thuật Desmos SAT Math (750–800 Hacks)'.normalize(
                      'NFC'
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {'Chọn "Nạp công thức" để chèn thêm vào bài đang làm, hoặc "Mở bảng trắng" để tạo khung đồ thị mới.'.normalize(
                      'NFC'
                    )}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPresetsOpen(false)}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-slate-300 cursor-pointer"
              >
                {'Đóng'.normalize('NFC')}
              </button>
            </div>

            {/* Các tab phân loại chủ đề */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {DESMOS_PRESET_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border ${
                    activeCategory === cat.id
                      ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-sm'
                      : 'bg-slate-950/90 text-slate-300 border-white/10 hover:bg-white/10'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Danh sách các thẻ Preset */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredPresets.map((preset) => (
              <div
                key={preset.id}
                className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 hover:border-cyan-400/40 transition space-y-3 shadow-lg"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[10px] font-mono font-bold">
                        {preset.badge}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-white/10 text-amber-300 text-[11px] font-mono font-bold">
                        {preset.formulaPreview}
                      </span>
                    </div>
                    <h4 className="text-sm font-extrabold text-white">
                      {preset.title}
                    </h4>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  💡 {preset.tip}
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(preset, 'insert')}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md cursor-pointer transition"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>{'Chèn (Insert)'.normalize('NFC')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset(preset, 'new_canvas')}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-amber-400/40 text-amber-300 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{'Làm mới (New)'.normalize('NFC')}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KHUNG ĐỒ THỊ DESMOS CHÍNH */}
      <div className="flex-1 w-full relative bg-white overflow-hidden">
        <div ref={containerRef} className="absolute inset-0 w-full h-full" />
      </div>
    </div>
  );
}