import React, { useState } from 'react';
import { X, Sparkles, SlidersHorizontal } from 'lucide-react';

export default function MatrixModal({ isOpen, onClose, topicsList, onStartSession }) {
  const [selectedTopics, setSelectedTopics] = useState(topicsList.map(t => t.name));
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState('All');
  const [mode, setMode] = useState('PRACTICE'); // PRACTICE hoặc REAL_EXAM

  if (!isOpen) return null;

  const toggleTopic = (name) => {
    if (selectedTopics.includes(name)) {
      if (selectedTopics.length > 1) {
        setSelectedTopics(selectedTopics.filter(t => t !== name));
      }
    } else {
      setSelectedTopics([...selectedTopics, name]);
    }
  };

  const handleStart = () => {
    onStartSession({
      topics: selectedTopics,
      count: questionCount,
      difficulty,
      mode
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-brand-800 font-bold text-lg mb-1">
          <SlidersHorizontal className="w-5 h-5" />
          <span>Thiết lập ma trận đề thi</span>
        </div>
        <p className="text-xs text-slate-500 mb-5">Hệ thống tự động sinh ngẫu nhiên đề thi từ ngân hàng câu hỏi.</p>

        <div className="space-y-4">
          {/* Chọn chế độ thi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Chế độ kiểm tra:</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode('PRACTICE')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                  mode === 'PRACTICE'
                    ? 'border-brand-800 bg-brand-50 text-brand-800'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>Chế độ Luyện tập</span>
                <span className="text-[10px] font-normal text-slate-400">Xem ngay đáp án & lời giải</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('REAL_EXAM')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                  mode === 'REAL_EXAM'
                    ? 'border-brand-800 bg-brand-50 text-brand-800'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>Chế độ Thi thật (Mock Test)</span>
                <span className="text-[10px] font-normal text-slate-400">Đếm ngược, bảo mật đáp án</span>
              </button>
            </div>
          </div>

          {/* Chọn số lượng câu hỏi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Số lượng câu hỏi:</label>
            <div className="flex gap-2">
              {[5, 10, 20, 35].map(cnt => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setQuestionCount(cnt)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
                    questionCount === cnt
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {cnt} câu
                </button>
              ))}
            </div>
          </div>

          {/* Độ khó */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Độ khó mục tiêu:</label>
            <select
              value={difficulty}
              onChange={e => setDifficulty(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2.5 outline-none"
            >
              <option value="All">Ngẫu nhiên mọi độ khó</option>
              <option value="Easy">Dễ</option>
              <option value="Medium">Trung bình</option>
              <option value="Hard">Khó (Hard)</option>
            </select>
          </div>

          {/* Chọn các chuyên đề */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Chuyên đề muốn luyện:</label>
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
              {topicsList.map(t => {
                const isSelected = selectedTopics.includes(t.name);
                return (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => toggleTopic(t.name)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                      isSelected
                        ? 'bg-brand-800 text-white border-brand-800'
                        : 'border-slate-200 text-slate-500 bg-white hover:bg-slate-50'
                    }`}
                  >
                    {t.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <button
          onClick={handleStart}
          className="w-full mt-6 py-3 bg-brand-800 hover:bg-brand-900 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>Bắt đầu làm bài ngay</span>
        </button>
      </div>
    </div>
  );
}