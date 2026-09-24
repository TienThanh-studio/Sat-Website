// src/pages/DocumentsPage.jsx
import React from 'react';
import { FileText, Download, ShieldCheck } from 'lucide-react';

export default function DocumentsPage() {
  const docs = [
    { title: 'SAT Reading Practice Workbook 2026', size: '14.2 MB', downloads: 1420 },
    { title: 'SAT Vocabulary Masterlist Phase 1 & 2', size: '3.8 MB', downloads: 890 },
    { title: 'Standard English Conventions Cheat Sheet', size: '1.5 MB', downloads: 2310 },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-brand-800" />
          <span>Kho tài liệu ôn luyện độc quyền</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">Tài liệu học tập chính thống tải về định dạng PDF.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 shadow-sm overflow-hidden">
        {docs.map((doc, idx) => (
          <div key={idx} className="p-5 flex items-center justify-between hover:bg-slate-50 transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-brand-800 flex items-center justify-center font-bold">
                PDF
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">{doc.title}</h4>
                <span className="text-[11px] text-slate-400 font-medium">Kích thước: {doc.size} • Lượt tải: {doc.downloads}</span>
              </div>
            </div>
            <button className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-brand-800 bg-brand-50 hover:bg-brand-100 rounded-xl transition border border-brand-200">
              <Download className="w-3.5 h-3.5" />
              <span>Tải xuống</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}