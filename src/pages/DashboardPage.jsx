import React from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Trophy, 
  Flame, 
  Target, 
  BookOpen, 
  Clock, 
  CheckCircle2 
} from 'lucide-react';

export default function DashboardPage({ onNavigateToQuestionBank }) {
  // Chỉ hiển thị các khóa/lớp đang mở, bỏ hoàn toàn các đề đã hết hạn
  const activeCourses = [
    { 
      id: 'c1',
      phase: 'RW Phase 2', 
      title: 'Reading & Writing Advanced Masterclass', 
      lessons: '18 / 24 buổi',
      progress: 75,
      nextDeadline: 'Chủ nhật tuần này'
    },
    { 
      id: 'c2',
      phase: 'Vocabulary Boost', 
      title: 'Kho từ vựng chuyên sâu Band 750+', 
      lessons: '320 / 500 từ',
      progress: 64,
      nextDeadline: 'Luyện tập mỗi ngày'
    },
    { 
      id: 'c3',
      phase: 'Mock Test Series', 
      title: 'Bộ đề dự đoán Digital SAT 2026', 
      lessons: '4 / 10 đề',
      progress: 40,
      nextDeadline: 'Đang mở'
    }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* 1. HERO BANNER THAY THẾ CÁC ĐỀ HẾT HẠN */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-900 via-brand-800 to-rose-900 text-white p-8 md:p-10 shadow-lg shadow-brand-900/10">
        {/* Họa tiết nền mờ trang trí */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 -mb-10 w-64 h-64 rounded-full bg-rose-500/10 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Cột trái: Lời dẫn & Kêu gọi hành động */}
          <div className="max-w-xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-rose-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Chinh phục mục tiêu Digital SAT 1500+</span>
            </div>
            
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">
              Sẵn sàng bứt phá điểm số hôm nay?
            </h2>
            
            <p className="text-sm text-rose-100/80 leading-relaxed font-light">
              Ngân hàng đề thi được cập nhật liên tục với các dạng câu hỏi Word in Context, Grammar và Inference bám sát ma trận mới nhất.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={onNavigateToQuestionBank}
                className="px-6 py-3 rounded-2xl bg-white text-brand-900 font-bold text-xs hover:bg-rose-50 hover:shadow-lg transition-all flex items-center gap-2 group"
              >
                <span>Vào luyện đề ngay</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <div className="text-xs text-rose-200/90 flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-300" />
                <span>Khoảng 15 phút mỗi ngày để tạo thói quen</span>
              </div>
            </div>
          </div>

          {/* Cột phải: Khung ảnh / Đồ họa học tập hiện đại */}
          <div className="relative shrink-0">
            <div className="w-64 h-44 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-5 flex flex-col justify-between shadow-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-200 uppercase tracking-wider">Hôm nay</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div>
                <div className="text-3xl font-black text-white">45 / 50</div>
                <div className="text-[11px] text-rose-200 mt-1">Câu hỏi mục tiêu hoàn thành</div>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-black/20 rounded-full h-2 overflow-hidden">
                <div className="bg-emerald-400 h-full rounded-full transition-all duration-500" style={{ width: '90%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CÁC THẺ THỐNG KÊ NHANH (QUICK STATS) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Flame className="w-6 h-6 fill-amber-500" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold">Chuỗi học tập</div>
            <div className="text-lg font-black text-slate-800">7 ngày liên tiếp</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold">Tỉ lệ chính xác</div>
            <div className="text-lg font-black text-slate-800">82.4%</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-800 flex items-center justify-center font-bold">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold">Xếp hạng tuần</div>
            <div className="text-lg font-black text-slate-800">Top 5% học viên</div>
          </div>
        </div>
      </div>

      {/* 3. DANH SÁCH KHÓA HỌC ĐANG HOẠT ĐỘNG (ACTIVE ONLY) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Lớp học & Lộ trình đang học</h3>
            <p className="text-xs text-slate-400 mt-0.5">Tiếp tục từ nơi bạn đã dừng lại</p>
          </div>
          <button 
            onClick={onNavigateToQuestionBank}
            className="text-xs font-bold text-brand-800 hover:text-brand-900 hover:underline flex items-center gap-1"
          >
            <span>Tất cả khoá</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {activeCourses.map(course => (
            <div
              key={course.id}
              onClick={onNavigateToQuestionBank}
              className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-brand-800/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <span className="text-[11px] font-bold text-brand-800 uppercase tracking-wider block mb-2">
                  {course.phase}
                </span>
                <h4 className="text-sm font-bold text-slate-800 group-hover:text-brand-800 transition line-clamp-2 mb-4 leading-snug">
                  {course.title}
                </h4>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Tiến độ: {course.lessons}</span>
                  <span className="font-bold text-slate-800">{course.progress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-brand-800 h-full rounded-full transition-all duration-300"
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}