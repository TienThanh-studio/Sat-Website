// src/pages/DocumentsPage.jsx
import React, { useState } from 'react';
import { FileText, Download } from 'lucide-react';

export default function DocumentsPage() {
  const [docs, setDocs] = useState(() => {
    return JSON.parse(localStorage.getItem('admin_documents') || '[]');
  });

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-brand-800" />
          <span>Kho tài liệu ôn luyện độc quyền</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">Tài liệu học tập chính thống tải về định dạng PDF.</p>
      </div>

      {docs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center shadow-sm">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">Chưa có tài liệu nào</h3>
          <p className="text-xs text-slate-500 mt-1">
            Quản trị viên sẽ cập nhật tài liệu học tập trong thời gian tới.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 shadow-sm overflow-hidden">
          {docs.map((doc, idx) => (
            <div key={idx} className="p-5 flex items-center justify-between hover:bg-slate-50 transition">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs">
                  PDF
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{doc.title}</h4>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Kích thước: {doc.size || 'N/A'} • Lượt tải: {doc.downloads || 0}
                  </span>
                </div>
              </div>
              <a 
                href={doc.url || '#'} 
                download={doc.title}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition"
              >
                <Download className="w-4 h-4" />
                Tải xuống
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}