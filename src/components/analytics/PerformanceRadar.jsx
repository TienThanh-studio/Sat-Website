import React from 'react';
import { Target, Zap, AlertTriangle, ArrowRight } from 'lucide-react';
import { questionService } from '../../services/questionService';

export default function PerformanceRadar({ onQuickPractice }) {
  // Lấy lịch sử làm bài và câu sai từ LocalStorage
  const mistakes = JSON.parse(localStorage.getItem('sat_mistakes') || '[]');
  const categories = questionService.getCategories();

  // Thống kê tỷ lệ làm đúng trên từng Domain
  const domainStats = categories.map(cat => {
    const catMistakes = mistakes.filter(m => 
      m.category?.toLowerCase() === cat.title?.toLowerCase() ||
      m.category?.toLowerCase() === cat.id?.toLowerCase()
    );
    const totalAssigned = Math.max(cat.questionCount, 10);
    const wrongCount = catMistakes.length;
    const estimatedAccuracy = Math.max(20, Math.min(100, Math.round(((totalAssigned - wrongCount) / totalAssigned) * 100)));

    return {
      id: cat.id,
      title: cat.title,
      domain: cat.domain,
      section: cat.section,
      accuracy: estimatedAccuracy,
      wrongCount,
      questions: cat.questions || []
    };
  });

  // Tìm Domain có độ chính xác thấp nhất (điểm yếu cần khắc phục)
  const weakestDomain = [...domainStats].sort((a, b) => a.accuracy - b.accuracy)[0];

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-600" />
            <span>Phân tích năng lực theo Domain (Skill Analytics)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Đánh giá mức độ thành thạo và phát hiện lỗ hổng kiến thức</p>
        </div>

        {weakestDomain && weakestDomain.questions.length > 0 && (
          <button
            type="button"
            onClick={() => onQuickPractice({
              sessionId: `weakness_${weakestDomain.id}_${Date.now()}`,
              title: `Củng cố điểm yếu: ${weakestDomain.title}`,
              section: weakestDomain.section,
              category: weakestDomain.title,
              questions: weakestDomain.questions.slice(0, 10),
              duration: 900,
              mode: 'PRACTICE'
            })}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition border border-rose-200 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 fill-rose-500" />
            <span>Luyện điểm yếu nhất ngay</span>
          </button>
        )}
      </div>

      {/* THANH ĐO NĂNG LỰC TỪNG CHỦ ĐỀ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {domainStats.map((item) => (
          <div key={item.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 truncate pr-2">{item.title}</span>
              <span className={`font-mono font-bold ${
                item.accuracy >= 80 ? 'text-emerald-600' : item.accuracy >= 60 ? 'text-amber-600' : 'text-rose-600'
              }`}>
                {item.accuracy}%
              </span>
            </div>

            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 rounded-full ${
                  item.accuracy >= 80 ? 'bg-emerald-500' : item.accuracy >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${item.accuracy}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>{item.domain}</span>
              <span>{item.wrongCount > 0 ? `${item.wrongCount} câu sai trong lịch sử` : 'Chưa ghi nhận lỗi'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}