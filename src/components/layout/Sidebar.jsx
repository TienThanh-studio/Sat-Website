import React from 'react';
import { 
  Home, BookOpen, Layers, BookmarkCheck, 
  FileText, ShieldCheck, Settings, LogOut, MessageSquare 
} from 'lucide-react';

export default function Sidebar({ 
  activePage, 
  setActivePage, 
  activeTab, 
  setActiveTab,
  userRole = 'ADMIN',
  onLogout 
}) {
  const handlePageChange = (id) => {
    if (typeof setActivePage === 'function') setActivePage(id);
    if (typeof setActiveTab === 'function') setActiveTab(id);
  };

  const currentPage = activePage || activeTab || 'dashboard';

  const menuItems = [
    { id: 'dashboard', label: 'Trang chủ', icon: Home },
    { id: 'vocabulary', label: 'Kho từ vựng', icon: BookOpen },
    { id: 'question-bank', label: 'Ngân hàng câu hỏi', icon: Layers },
    { id: 'forum', label: 'Diễn đàn hỏi đáp', icon: MessageSquare }, // MỤC DIỄN ĐÀN MỚI
    { id: 'mistakes', label: 'Sổ tay câu sai', icon: BookmarkCheck },
    { id: 'documents', label: 'Kho tài liệu', icon: FileText },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 h-full select-none">
      <div className="p-4 space-y-6 overflow-y-auto">
        {/* LOGO */}
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-lg shadow-sm">
            S
          </div>
          <div>
            <h1 className="font-extrabold text-sm text-slate-900 tracking-tight leading-tight">SAT</h1>
            <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Exam Platform</p>
          </div>
        </div>

        {/* CHỨC NĂNG CHÍNH */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Chức năng</p>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id || (item.id === 'vocabulary' && (currentPage === 'vocab' || currentPage === 'flashcards'));
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handlePageChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 font-bold shadow-2xs'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* DÀNH CHO ADMIN */}
        <div className="space-y-1 pt-2">
          <p className="px-3 text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-2">Dành cho Admin</p>
          <button
            type="button"
            onClick={() => handlePageChange('admin-panel')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              currentPage === 'admin' || currentPage === 'admin-panel' || currentPage === 'admin-tools'
                ? 'bg-amber-50 text-amber-900 font-bold border border-amber-200/60 shadow-2xs'
                : 'text-slate-500 hover:bg-amber-50/50 hover:text-amber-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>Quản trị đề & Mã mời</span>
          </button>
        </div>

        {/* CÀI ĐẶT */}
        <div className="space-y-1 pt-2">
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Cài đặt</p>
          <button
            type="button"
            onClick={() => handlePageChange('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              currentPage === 'settings'
                ? 'bg-slate-100 text-slate-900 font-bold shadow-2xs'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Cài đặt</span>
          </button>
        </div>
      </div>

      {/* ĐĂNG XUẤT */}
      <div className="p-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}