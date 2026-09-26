import React, { useState, useEffect } from 'react';
import { 
  Key, Plus, Trash2, Copy, Check, FileUp, 
  FileText, ShieldCheck, Database, RefreshCw,
  FileCode, Play, CheckCircle2, Calculator
} from 'lucide-react';
import defaultCodes from '../../data/validCodes.json';
import MathRenderer from '../common/MathRenderer';

export default function QuestionManager() {
  const [activeTab, setActiveTab] = useState('codes'); // 'codes' | 'docs' | 'latex'

  // ================= STATE QUẢN LÝ MÃ MỜI =================
  const [codes, setCodes] = useState([]);
  const [newCodeName, setNewCodeName] = useState('');
  const [newCodeRole, setNewCodeRole] = useState('STUDENT');
  const [copiedCode, setCopiedCode] = useState(null);

  // ================= STATE QUẢN LÝ TÀI LIỆU =================
  const [documents, setDocuments] = useState([]);
  const [docTitle, setDocTitle] = useState('');
  const [docSize, setDocSize] = useState('2.5 MB');
  const [docUrl, setDocUrl] = useState('');
  const [docSuccess, setDocSuccess] = useState(false);

  // ================= STATE QUẢN LÝ LATEX MATH =================
  const [latexInput, setLatexInput] = useState('');
  const [mathCategory, setMathCategory] = useState('Algebra');
  const [parsedPreview, setParsedPreview] = useState([]);
  const [mathSuccess, setMathSuccess] = useState(false);
  const [existingMathCount, setExistingMathCount] = useState(0);

  // Khởi tạo dữ liệu
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

  // --- XỬ LÝ MÃ MỜI ---
  const handleGenerateCode = (e) => {
    e.preventDefault();
    const codeString = newCodeName.trim().toUpperCase() || `SAT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    if (codes.some(c => (typeof c === 'string' ? c : c.code) === codeString)) {
      alert('Mã này đã tồn tại!');
      return;
    }

    const newEntry = {
      code: codeString,
      role: newCodeRole,
      createdAt: new Date().toLocaleDateString()
    };

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

  // --- XỬ LÝ TÀI LIỆU ---
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

  // --- XỬ LÝ PARSE LATEX VÀO HỆ THỐNG THI ---
  const handleParseLatex = () => {
    if (!latexInput.trim()) return;

    const questions = [];
    // Hỗ trợ nhận diện các kiểu block LaTeX phổ biến (\begin{question}, Question 1:, \item, v.v...)
    const blocks = latexInput.split(/\\begin\{question\}|Question\s+\d+:|\\item\s*\[\d+\]/gi).filter(b => b.trim());

    blocks.forEach((block, idx) => {
      const cleanBlock = block.replace(/\\end\{question\}/gi, '').trim();
      if (!cleanBlock) return;

      // 1. Tách đề bài (Prompt)
      let prompt = cleanBlock.split(/\\choice|(?:\n|\r|\s)[A-D]\./i)[0].trim();
      prompt = prompt.replace(/\\question/gi, '').trim();

      // 2. Tách 4 lựa chọn A, B, C, D
      const options = { A: '', B: '', C: '', D: '' };
      const choiceMatches = [...cleanBlock.matchAll(/(?:\\choice|[A-D]\.)\s*([A-D])?\.?\s*([^\n\r\\]+)/gi)];

      if (choiceMatches.length >= 4) {
        options.A = choiceMatches[0][2]?.trim() || '';
        options.B = choiceMatches[1][2]?.trim() || '';
        options.C = choiceMatches[2][2]?.trim() || '';
        options.D = choiceMatches[3][2]?.trim() || '';
      }

      // 3. Tách đáp án đúng
      const ansMatch = cleanBlock.match(/(?:\\answer|Answer:?|Đáp án:?)\s*([A-D])/i);
      const correctAnswer = ansMatch ? ansMatch[1].toUpperCase() : 'A';

      // 4. Tách lời giải thích
      const expMatch = cleanBlock.match(/(?:\\explanation|Explanation:?|Lời giải:?)\s*([\s\S]*?)(?=(?:\\choice|[A-D]\.|$))/i);
      const explanation = expMatch ? expMatch[1].trim() : '';

      questions.push({
        id: `math_${mathCategory.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}_${idx + 1}`,
        category: mathCategory,
        section: 'Math',
        prompt: prompt,
        question: "Which choice most logically answers the question?",
        options: options,
        correctAnswer: correctAnswer,
        explanation: explanation
      });
    });

    if (questions.length === 0) {
      alert("Chưa nhận diện được câu hỏi. Hãy đảm bảo nội dung có cấu trúc câu hỏi và các phương án A, B, C, D hoặc \\choice.");
      return;
    }

    setParsedPreview(questions);
  };

  // Lưu toàn bộ câu hỏi đã parse vào localStorage
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

  // Xóa toàn bộ câu hỏi Math trong bộ nhớ
  const handleClearMathQuestions = () => {
    if (!window.confirm("Bạn có chắc muốn xóa tất cả câu hỏi Math đã upload?")) return;
    localStorage.removeItem('sat_math_questions');
    setExistingMathCount(0);
  };

  return (
    <div className="space-y-6">
      {/* Header khu vực Quản trị */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-600" />
            <span>Khu vực Quản trị Hệ thống</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý mã mời, tải tài liệu PDF và upload câu hỏi Math trực tiếp từ file LaTeX / Overleaf.
          </p>
        </div>

        {/* Tab chuyển đổi 3 chức năng */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
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
        </div>
      </div>

      {/* ================= TAB 1: QUẢN LÝ MÃ MỜI ================= */}
      {activeTab === 'codes' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs h-fit space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-600" />
              Tạo mã mời mới
            </h3>
            
            <form onSubmit={handleGenerateCode} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Mã mời (Tùy chọn nhập hoặc để trống tự tạo)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: SAT-PRO-2026"
                  value={newCodeName}
                  onChange={(e) => setNewCodeName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Quyền truy cập
                </label>
                <select
                  value={newCodeRole}
                  onChange={(e) => setNewCodeRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="STUDENT">Học viên (Truy cập đầy đủ kho đề)</option>
                  <option value="ADMIN">Quản trị viên (Admin)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                Tạo mã kích hoạt
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                Danh sách mã kích hoạt ({codes.length})
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {codes.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Chưa có mã mời nào được tạo.
                </div>
              ) : (
                codes.map((item, idx) => {
                  const codeVal = typeof item === 'string' ? item : item.code;
                  const role = typeof item === 'object' ? item.role : 'STUDENT';
                  const date = typeof item === 'object' ? item.createdAt : 'Hôm nay';

                  return (
                    <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center font-bold text-xs">
                          #
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-slate-800">{codeVal}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              role === 'ADMIN' ? 'bg-rose-50 text-rose-700' : 'bg-indigo-50 text-indigo-700'
                            }`}>
                              {role}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400">Ngày tạo: {date}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopy(codeVal)}
                          className="p-2 hover:bg-slate-200 text-slate-600 rounded-lg transition"
                          title="Sao chép mã"
                        >
                          {copiedCode === codeVal ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCode(codeVal)}
                          className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition"
                          title="Xóa mã"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: QUẢN LÝ TÀI LIỆU ================= */}
      {activeTab === 'docs' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs h-fit space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileUp className="w-4 h-4 text-indigo-600" />
              Đăng tải tài liệu mới
            </h3>

            {docSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl font-medium">
                Tài liệu đã được đăng lên Kho tài liệu thành công!
              </div>
            )}

            <form onSubmit={handleAddDocument} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Tên tài liệu PDF</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: SAT Math Cheat Sheet 2026"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Kích thước file (ước tính)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: 3.5 MB"
                  value={docSize}
                  onChange={(e) => setDocSize(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Đường dẫn tải file / Google Drive link</label>
                <input
                  type="text"
                  placeholder="https://drive.google.com/..."
                  value={docUrl}
                  onChange={(e) => setDocUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                Đăng tải lên Kho tài liệu
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                Tài liệu đang hiển thị ({documents.length})
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {documents.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Chưa có tài liệu nào. Hãy thêm tài liệu ở khung bên trái.
                </div>
              ) : (
                documents.map((doc) => (
                  <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs">
                        PDF
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{doc.title}</h4>
                        <span className="text-[11px] text-slate-400">
                          {doc.size} • Đăng ngày {doc.createdAt}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteDoc(doc.id)}
                      className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition"
                      title="Xóa tài liệu"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: UPLOAD ĐỀ MATH TỪ LATEX ================= */}
      {activeTab === 'latex' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-sm">Nhập mã nguồn LaTeX (.tex / Overleaf)</h3>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                  Hiện có: {existingMathCount} câu
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
                  <button
                    type="button"
                    onClick={handleClearMathQuestions}
                    className="text-xs text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg font-semibold border border-rose-200 transition"
                  >
                    Xóa tất cả Math
                  </button>
                )}
              </div>
            </div>

            {mathSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Đã lưu thành công các câu hỏi Math vào ngân hàng đề thi!</span>
              </div>
            )}

            <textarea
              rows={9}
              value={latexInput}
              onChange={(e) => setLatexInput(e.target.value)}
              placeholder={`Dán mã LaTeX câu hỏi vào đây. Ví dụ định dạng hỗ trợ:\n\\begin{question}\nCho phương trình $2x^2 - 8x + c = 0$. Tìm $c$ để phương trình có nghiệm kép.\nA. $c = 4$\nB. $c = 8$\nC. $c = 16$\nD. $c = 2$\n\\answer B\n\\explanation Biệt thức $\\Delta' = 4^2 - 2c = 16 - 2c = 0 \\implies c = 8$.\n\\end{question}`}
              className="w-full font-mono text-xs p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed"
            />

            <div className="flex justify-between items-center">
              <span className="text-[11px] text-slate-400">
                Hỗ trợ công thức nội dòng <code>$...$</code> và công thức khối <code>$$...$$</code>
              </span>
              <button
                type="button"
                onClick={handleParseLatex}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Phân tích câu hỏi (Parse LaTeX)</span>
              </button>
            </div>
          </div>

          {/* VÙNG XEM TRƯỚC RENDER BẰNG KATEX */}
          {parsedPreview.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-emerald-600" />
                  Xem trước công thức nhận diện ({parsedPreview.length} câu hỏi)
                </h4>
                <button
                  type="button"
                  onClick={handleSaveMathQuestions}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Lưu tất cả vào Ngân hàng đề Math
                </button>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {parsedPreview.map((q, i) => (
                  <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-indigo-700">Câu {i + 1} • {q.category}</span>
                      <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Đáp án: {q.correctAnswer}
                      </span>
                    </div>

                    <div className="text-sm text-slate-800 leading-relaxed">
                      <MathRenderer text={q.prompt} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                      {Object.entries(q.options).map(([k, val]) => (
                        <div key={k} className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs flex items-center gap-2">
                          <span className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] shrink-0 ${
                            q.correctAnswer === k ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {k}
                          </span>
                          <span className="text-slate-800"><MathRenderer text={val} /></span>
                        </div>
                      ))}
                    </div>

                    {q.explanation && (
                      <div className="p-2.5 bg-indigo-50/60 rounded-lg text-xs text-indigo-950 border border-indigo-100">
                        <span className="font-bold">Lời giải: </span>
                        <MathRenderer text={q.explanation} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}