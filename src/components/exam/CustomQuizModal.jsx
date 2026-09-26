import React, { useState } from 'react';
import { X, Sparkles, Clock, Sliders, Play } from 'lucide-react';
import { questionService } from '../../services/questionService';

export default function CustomQuizModal({ isOpen, onClose, onStartQuiz }) {
  if (!isOpen) return null;

  const categories = questionService.getCategories();
  const [selectedCatId, setSelectedCatId] = useState('ALL');
  const [questionCount, setQuestionCount] = useState(10);
  const [durationMinutes, setDurationMinutes] = useState(15);

  const handleGenerate = (e) => {
    e.preventDefault();

    let pool = [];
    if (selectedCatId === 'ALL') {
      pool = categories.flatMap(c => c.questions || []);
    } else {
      const target = categories.find(c => c.id === selectedCatId);
      pool = target?.questions || [];
    }

    if (pool.length === 0) {
      alert('Chủ đề này chưa có câu hỏi để tạo đề thi!');
      return;
    }

    // Trộn ngẫu nhiên và bốc đúng số câu yêu cầu
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffled.slice(0, Math.min(questionCount, shuffled.length));

    const targetCat = categories.find(c => c.id === selectedCatId);

    onStartQuiz({
      sessionId: `custom_quiz_${Date.now()}`,
      title: selectedCatId === 'ALL' ? `Custom Quiz (${selectedQuestions.length} câu ngẫu nhiên)` : `Luyện nhanh: ${targetCat?.title}`,
      section: targetCat?.section || 'Math',
      category: targetCat?.title || 'General Practice',
      questions: selectedQuestions,
      duration: durationMinutes * 60,
      mode: 'PRACTICE'
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs select-none">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-5 animate-fadeIn"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-sm">Tạo đề thi tùy biến (Custom Quiz Generator)</h3>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Chọn chủ đề kiểm tra</label>
            <select
              value={selectedCatId}
              onChange={(e) => setSelectedCatId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">Tất cả các chủ đề (Đề tổng hợp)</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  [{cat.section}] {cat.title} ({cat.questionCount} câu)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Số lượng câu</label>
              <select
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none"
              >
                <option value={5}>5 câu</option>
                <option value={10}>10 câu</option>
                <option value={15}>15 câu</option>
                <option value={20}>20 câu</option>
                <option value={27}>27 câu (Chuẩn 1 Module)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Thời gian làm bài</label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none"
              >
                <option value={10}>10 phút (Luyện tốc độ)</option>
                <option value={15}>15 phút</option>
                <option value={25}>25 phút</option>
                <option value={35}>35 phút (Chuẩn Module)</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Bắt đầu làm bài ngay</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}