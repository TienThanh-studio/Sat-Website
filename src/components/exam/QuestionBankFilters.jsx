import React from 'react';
import { RotateCcw } from 'lucide-react';

export default function QuestionBankFilters({
  isMultiTopic,
  setIsMultiTopic,
  difficulty,
  setDifficulty,
  status,
  setStatus,
  onReset
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4 mb-6">
      <div className="flex flex-wrap items-center gap-6">
        {/* Toggle Nhiều chủ đề */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-600">Nhiều chủ đề</span>
          <button
            type="button"
            onClick={() => setIsMultiTopic(!isMultiTopic)}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ${
              isMultiTopic ? 'bg-brand-800' : 'bg-slate-200'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                isMultiTopic ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Dropdown Độ khó */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500">Độ khó:</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2 outline-none focus:border-brand-800"
          >
            <option value="All">Tất cả</option>
            <option value="Easy">Dễ</option>
            <option value="Medium">Trung bình</option>
            <option value="Hard">Khó</option>
          </select>
        </div>

        {/* Các câu đã đánh dấu */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500">Đánh dấu:</label>
          <select className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2 outline-none">
            <option>Tất cả</option>
            <option>Đã gắn cờ</option>
            <option>Chưa gắn cờ</option>
          </select>
        </div>

        {/* Trạng thái câu trả lời */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500">Trạng thái câu trả lời:</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2 outline-none focus:border-brand-800"
          >
            <option value="All">Tất cả</option>
            <option value="Correct">Đã làm đúng</option>
            <option value="Incorrect">Đã làm sai</option>
            <option value="Unanswered">Chưa làm</option>
          </select>
        </div>

        {/* Thời gian làm câu hỏi */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500">Thời gian làm (s):</label>
          <select className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2 outline-none">
            <option>0-20s to 5m+</option>
            <option>&lt; 30 giây</option>
            <option>30s - 1 phút</option>
            <option>&gt; 2 phút</option>
          </select>
        </div>
      </div>

      {/* Nút Đặt lại */}
      <button
        onClick={onReset}
        className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>Đặt lại</span>
      </button>
    </div>
  );
}