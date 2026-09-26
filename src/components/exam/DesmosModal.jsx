import React, { useEffect, useRef } from 'react';
import { X, Calculator, Minimize2 } from 'lucide-react';

export default function DesmosModal({ isOpen, onClose }) {
  const calculatorRef = useRef(null);
  const desmosInstanceRef = useRef(null);

  useEffect(() => {
    if (isOpen && calculatorRef.current && window.Desmos) {
      if (!desmosInstanceRef.current) {
        desmosInstanceRef.current = window.Desmos.GraphingCalculator(calculatorRef.current, {
          keypad: true,
          expressions: true,
          settingsMenu: true,
          zoomButtons: true,
          border: false
        });
      }
    }

    return () => {
      if (desmosInstanceRef.current && !isOpen) {
        desmosInstanceRef.current.destroy();
        desmosInstanceRef.current = null;
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/40 backdrop-blur-xs select-none">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-4xl h-[82vh] rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-fadeIn"
      >
        {/* Header */}
        <div className="px-5 py-3 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-indigo-700" />
            <h3 className="font-bold text-slate-800 text-sm">
              Desmos Graphing Calculator (Digital SAT Official)
            </h3>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-slate-200 text-slate-500 rounded-lg transition"
              title="Đóng máy tính"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Khung máy tính Desmos */}
        <div className="flex-1 w-full h-full relative" ref={calculatorRef} />
      </div>
    </div>
  );
}