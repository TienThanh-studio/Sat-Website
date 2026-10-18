// src/components/exam/DesmosModal.jsx
import React, { useEffect, useRef, useState } from 'react';
import { X, ArrowLeftRight } from 'lucide-react';

const SAMPLE_EXPRESSIONS = [
  { id: 'ex1', latex: 'f(x) = x^2 - 4x + 3' },
  { id: 'ex2', latex: 'g(x) = 2x - 2' },
  { id: 'ex3', latex: 'y_1 \\sim m x_1 + b' },
];

export default function DesmosModal({
  isOpen,
  onClose,
  initialExpressions = null,
  onWidthChange,
}) {
  const containerRef = useRef(null);
  const calculatorRef = useRef(null);

  const [dockSide, setDockSide] = useState('right');
  const [panelWidth, setPanelWidth] = useState(() => Math.round(window.innerWidth * 0.48));
  const isResizingRef = useRef(false);

  useEffect(() => {
    if (typeof onWidthChange === 'function' && isOpen) {
      onWidthChange(panelWidth);
    }
  }, [panelWidth, isOpen, onWidthChange]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizingRef.current) return;
      const newW = dockSide === 'right' ? window.innerWidth - e.clientX : e.clientX;
      if (newW >= 320 && newW <= window.innerWidth * 0.85) {
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
        calculatorRef.current = window.Desmos.GraphingCalculator(containerRef.current, {
          keypad: true,
          expressions: true,
          settingsMenu: true,
          zoomButtons: true,
          expressionsTopbar: true,
          border: false,
          autosize: true,
        });
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
      const existingScript = document.querySelector('script[src*="desmos.com/api"]');
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://www.desmos.com/api/v1.9/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6';
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
    if (calculatorRef.current) calculatorRef.current.setBlank();
  };

  const handleReset = () => {
    if (calculatorRef.current) {
      calculatorRef.current.setBlank();
      calculatorRef.current.setMathBounds({ left: -10, right: 10, bottom: -10, top: 10 });
    }
  };

  const handleLoadExample = () => {
    if (calculatorRef.current) {
      calculatorRef.current.setBlank();
      calculatorRef.current.setMathBounds({ left: -10, right: 10, bottom: -10, top: 10 });
      SAMPLE_EXPRESSIONS.forEach((exp) => calculatorRef.current.setExpression(exp));
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{ width: `${panelWidth}px` }}
      className={`fixed inset-y-0 ${
        dockSide === 'right' ? 'right-0 border-l-2' : 'left-0 border-r-2'
      } z-50 bg-white border-[#2568a9] shadow-[-15px_0_40px_rgba(0,0,0,0.35)] flex flex-col select-none font-sans`}
    >
      {/* Thanh kéo đổi chiều ngang (Resizer) */}
      <div
        onMouseDown={(e) => {
          e.preventDefault();
          isResizingRef.current = true;
          document.body.style.cursor = 'col-resize';
        }}
        title="Kéo sang trái/phải để thay đổi chiều ngang máy tính"
        className={`absolute top-0 bottom-0 ${
          dockSide === 'right' ? '-left-2' : '-right-2'
        } w-4 cursor-col-resize z-50 flex items-center justify-center group`}
      >
        <div className="w-1.5 h-12 rounded-full bg-slate-400/60 group-hover:bg-[#2568a9] transition-colors shadow" />
      </div>

      <div className="h-14 px-4 bg-[#2568a9] text-white flex items-center justify-between shrink-0 border-b border-[#1d538a]">
        <div className="flex items-center gap-2.5">
          <span className="font-bold text-sm sm:text-base tracking-tight">Desmos Calculator</span>
          <button
            type="button"
            onClick={() => setDockSide((prev) => (prev === 'right' ? 'left' : 'right'))}
            className="px-2 py-1 rounded bg-white/15 hover:bg-white/25 border border-white/25 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer ml-1"
          >
            <ArrowLeftRight className="w-3 h-3" />
            <span className="hidden sm:inline">{dockSide === 'right' ? 'Sang trái' : 'Sang phải'}</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleClear}
            className="px-2.5 py-1 rounded bg-white/15 hover:bg-white/25 border border-white/30 text-white text-xs font-medium transition cursor-pointer"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-2.5 py-1 rounded bg-white/15 hover:bg-white/25 border border-white/30 text-white text-xs font-medium transition cursor-pointer"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleLoadExample}
            className="px-2.5 py-1 rounded bg-white/15 hover:bg-white/25 border border-white/30 text-white text-xs font-medium transition cursor-pointer"
          >
            Example
          </button>
          <button
            type="button"
            onClick={onClose}
            className="ml-1 w-8 h-7 rounded bg-[#d93848] hover:bg-[#b82836] border border-red-300/40 text-white flex items-center justify-center transition cursor-pointer shadow-xs"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      <div className="flex-1 w-full relative bg-white overflow-hidden">
        <div ref={containerRef} className="absolute inset-0 w-full h-full" />
      </div>
    </div>
  );
}