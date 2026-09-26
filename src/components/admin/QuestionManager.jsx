import React, { useState, useEffect } from 'react';
import { 
  Key, Plus, Trash2, Copy, Check, FileUp, 
  ShieldCheck, FileCode, Play, CheckCircle2, 
  Calculator, Download
} from 'lucide-react';
import defaultCodes from '../../data/validCodes.json';
import MathRenderer from '../common/MathRenderer';
import { parseLatexDocument } from '../../services/latexParser';

export default function QuestionManager() {
  const [activeTab, setActiveTab] = useState('latex');

  // Quản lý mã mời
  const [codes, setCodes] = useState([]);
  const [newCodeName, setNewCodeName] = useState('');
  const [newCodeRole, setNewCodeRole] = useState('STUDENT');
  const [copiedCode, setCopiedCode] = useState(null);

  // Quản lý tài liệu
  const [documents, setDocuments] = useState([]);
  const [docTitle, setDocTitle] = useState('');
  const [docSize, setDocSize] = useState('2.5 MB');
  const [docUrl, setDocUrl] = useState('');
  const [docSuccess, setDocSuccess] = useState(false);

  // Quản lý upload LaTeX Math
  const [latexInput, setLatexInput] = useState('');
  const [mathCategory, setMathCategory] = useState('Algebra');
  const [parsedPreview, setParsedPreview] = useState([]);
  const [mathSuccess, setMathSuccess] = useState(false);
  const [existingMathCount, setExistingMathCount] = useState(0);

  useEffect(() => {
    try {
      const savedCodes = localStorage.getItem('sat_access_codes');
      if (savedCodes) {
        setCodes(JSON.parse(savedCodes));
      } else {
        const initial = Array.isArray(defaultCodes) ? defaultCodes : [
          { code: 'SAT-VIP-2026', role: 'STUDENT', createdAt: new Date().toLocaleDateString() },
          { code: 'ADMIN-PRO-999', role: 'ADMIN', createdAt: new Date().toLocaleDateString() }
        ];
        setCodes(initial);
        localStorage.setItem('sat_access_codes', JSON.stringify(initial));
      }

      const savedDocs = localStorage.getItem('admin_documents');
      if (savedDocs) {
        setDocuments(JSON.parse(savedDocs));
      }

      const savedMath = JSON.parse(localStorage.getItem('sat_math_questions') || '[]');
      setExistingMathCount(savedMath.length);
    } catch (e) {
      console.warn("Lỗi load dữ liệu admin:", e);
    }
  }, []);

  const handleGenerateCode = (e) => {
    e.preventDefault();
    const codeString = newCodeName.trim().toUpperCase() || `SAT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    if (codes.some(c => (typeof c === 'string' ? c : c.code) === codeString)) {
      alert('Mã này đã tồn tại!');
      return;
    }
    const newEntry = { code: codeString, role: newCodeRole, createdAt: new Date().toLocaleDateString() };
    const updated = [newEntry, ...codes];
    setCodes(updated);
    localStorage.setItem('sat_access_codes', JSON.stringify(updated));
    setNewCodeName('');
  };

  const handleDeleteCode = (codeToDelete) => {
    if (!window.confirm(`Xác nhận xóa mã "${codeToDelete}"?`)) return;
    const updated = codes.filter(c => (typeof c === 'string' ? c : c.code) !== codeToDelete);
    setCodes(updated);
    localStorage.setItem('sat_access_codes', JSON.stringify(updated));
  };

  const handleCopy = (codeText) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCode(codeText);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleAddDocument = (e) => {
    e.preventDefault();
    if (!docTitle.trim()) return;
    const newDoc = {
      id: 'doc_' + Date.now(),
      title: docTitle.trim(),
      size: docSize || '2.0 MB',
      downloads: 0,
      url: docUrl.trim() || '#',
      createdAt: new Date().toLocaleDateString()
    };
    const updated = [newDoc, ...documents];
    setDocuments(updated);
    localStorage.setItem('admin_documents', JSON.stringify(updated));
    setDocTitle('');
    setDocUrl('');
    setDocSuccess(true);
    setTimeout(() => setDocSuccess(false), 3000);
  };

  const handleDeleteDoc = (id) => {
    if (!window.confirm('Xác nhận xóa tài liệu này khỏi kho?')) return;
    const updated = documents.filter(d => d.id !== id);
    setDocuments(updated);
    localStorage.setItem('admin_documents', JSON.stringify(updated));
  };

  // PHÂN TÍCH LATEX AN TOÀN 100% QUA HELPER MODULE
  const handleParseLatex = () => {
    if (!latexInput.trim()) return;
    const results = parseLatexDocument(latexInput, mathCategory);

    if (results.length === 0) {
      alert("Không tìm thấy câu hỏi \\question{số} hợp lệ trong mã nguồn!");
      return;
    }

    setParsedPreview(results);
  };

  const handleSaveMathQuestions = () => {
    if (parsedPreview.length === 0) return;
    const existing = JSON.parse(localStorage.getItem('sat_math_questions') || '[]');
    const updated = [...existing, ...parsedPreview];
    localStorage.setItem('sat_math_questions', JSON.stringify(updated));

    setExistingMathCount(updated.length);
    setMathSuccess(true);
    setParsedPreview([]);
    setLatexInput('');
    setTimeout(() => setMathSuccess(false), 3500);
  };

  const handleExportJson = () => {
    const questions = JSON.parse(localStorage.getItem('sat_math_questions') || '[]');
    if (questions.length === 0) {
      alert("Chưa có câu hỏi Math nào để xuất file!");
      return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(questions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "math.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleClearMathQuestions = () => {
    if (!window.confirm("Bạn có chắc muốn xóa tất cả câu hỏi Math đã upload?")) return;
    localStorage.removeItem('sat_math_questions');
    setExistingMathCount(0);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-600" />
            <span>Khu vực Quản trị Đề & Hệ thống</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý mã mời, tài liệu PDF và công cụ upload đề Math chuẩn LaTeX.
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('latex')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'latex' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-indigo-600" />
            Upload Math (LaTeX)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('codes')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'codes' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            Mã mời
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('docs')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'docs' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileUp className="w-3.5 h-3.5" />
            Kho tài liệu
          </button>
        </div>
      </div>

      {/* ================= TAB 1: UPLOAD ĐỀ MATH (LATEX) ================= */}
      {activeTab === 'latex' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-sm">Dán mã nguồn Overleaf (.tex)</h3>
                <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold">
                  Hiện có: {existingMathCount} câu trong ngân hàng
                </span>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={mathCategory}
                  onChange={(e) => setMathCategory(e.target.value)}
                  className="text-xs font-bold border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 outline-none"
                >
                  <option value="Algebra">Algebra (Đại số)</option>
                  <option value="Advanced Math">Advanced Math (Hàm số & Đa thức)</option>
                  <option value="Problem Solving">Problem Solving & Data Analysis</option>
                  <option value="Geometry">Geometry & Trigonometry</option>
                </select>

                {existingMathCount > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={handleExportJson}
                      className="flex items-center gap-1 text-xs text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg font-semibold border border-indigo-200 transition"
                      title="Xuất file math.json để lưu cố định vào src/data/questions"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Xuất math.json
                    </button>
                    <button
                      type="button"
                      onClick={handleClearMathQuestions}
                      className="text-xs text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg font-semibold border border-rose-200 transition"
                    >
                      Xóa tất cả
                    </button>
                  </>
                )}
              </div>
            </div>

            {mathSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Đã lưu thành công các câu hỏi Math vào hệ thống thi!</span>
              </div>
            )}

            <textarea
              rows={11}
              value={latexInput}
              onChange={(e) => setLatexInput(e.target.value)}
              placeholder="Dán toàn bộ mã nguồn file main.tex từ Overleaf vào đây..."
              className="w-full font-mono text-xs p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed"
            />

            <div className="flex justify-between items-center">
              <span className="text-[11px] text-slate-400">
                Tự động nhận diện TikZ, phân số lồng nhau, bảng Tabular và câu tự điền số.
              </span>
              <button
                type="button"
                onClick={handleParseLatex}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Phân tích câu hỏi (Parse LaTeX)</span>
              </button>
            </div>
          </div>

          {/* VÙNG XEM TRƯỚC BỘ ĐỀ */}
          {parsedPreview.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-emerald-600" />
                  Đã nhận diện chuẩn xác: {parsedPreview.length} câu hỏi
                </h4>
                <button
                  type="button"
                  onClick={handleSaveMathQuestions}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Lưu tất cả vào Ngân hàng Math
                </button>
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {parsedPreview.map((q) => (
                  <div key={q.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-indigo-700">Câu {q.questionNumber} • {q.category}</span>
                      <span className={`font-mono font-bold px-2 py-0.5 rounded border text-[11px] ${
                        q.isGridIn ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {q.isGridIn ? 'Câu tự điền số (Student-Produced Response)' : `Trắc nghiệm 4 lựa chọn`}
                      </span>
                    </div>

                    <div className="text-sm text-slate-800 leading-relaxed font-serif">
                      <MathRenderer text={q.prompt} />
                    </div>

                    {!q.isGridIn && q.options && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {Object.entries(q.options).map(([k, val]) => (
                          <div key={k} className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs flex items-center gap-2">
                            <span className="w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] bg-slate-100 text-slate-700 shrink-0">
                              {k}
                            </span>
                            <span className="text-slate-800 font-serif">
                              <MathRenderer text={val} />
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: MÃ MỜI ================= */}
      {activeTab === 'codes' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs h-fit space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-600" />
              Tạo mã mời mới
            </h3>
            <form onSubmit={handleGenerateCode} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Mã mời</label>
                <input
                  type="text"
                  placeholder="Ví dụ: SAT-PRO-2026"
                  value={newCodeName}
                  onChange={(e) => setNewCodeName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:bg-white focus:ring-2 focus:ring-amber-500 uppercase"
                />
              </div>
              <button type="submit" className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition cursor-pointer">
                Tạo mã
              </button>
            </form>
          </div>
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {codes.map((item, idx) => {
                const codeVal = typeof item === 'string' ? item : item.code;
                return (
                  <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50">
                    <span className="font-mono font-bold text-sm text-slate-800">{codeVal}</span>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => handleCopy(codeVal)} className="p-2 hover:bg-slate-200 rounded-lg cursor-pointer">
                        {copiedCode === codeVal ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button onClick={() => handleDeleteCode(codeVal)} className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: KHO TÀI LIỆU ================= */}
      {activeTab === 'docs' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs h-fit space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileUp className="w-4 h-4 text-indigo-600" />
              Đăng tải tài liệu mới
            </h3>
            {docSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl font-medium">
                Tài liệu đã được đăng tải thành công!
              </div>
            )}
            <form onSubmit={handleAddDocument} className="space-y-4">
              <input
                type="text"
                required
                placeholder="Tên tài liệu PDF"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
              <input
                type="text"
                placeholder="Link tải file PDF"
                value={docUrl}
                onChange={(e) => setDocUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
              <button type="submit" className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer">
                Đăng lên kho tài liệu
              </button>
            </form>
          </div>
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {documents.map((doc) => (
                <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <span className="text-xs font-bold text-slate-800">{doc.title}</span>
                  <button onClick={() => handleDeleteDoc(doc.id)} className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}