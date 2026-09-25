import React from 'react';
import { 
  Home, 
  BookOpen, 
  HelpCircle, 
  Folder, 
  FileSpreadsheet, 
  Settings, 
  Info,
  LogOut,
  Sparkles
} from 'lucide-react';

export default function Sidebar({ activePage, setActivePage, currentUser, onLogout }) {
  const mainMenus = [
    { id: 'dashboard', label: 'Trang chủ', icon: Home },
    { id: 'vocab', label: 'Kho từ vựng', icon: BookOpen },
    { id: 'question-bank', label: 'Ngân hàng câu hỏi', icon: HelpCircle },
    { id: 'documents', label: 'Kho tài liệu', icon: Folder },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 h-screen sticky top-0 shadow-sm">
      {/* Top Section */}
      <div>
        {/* Brand Logo */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-800 text-white flex items-center justify-center font-black text-xl shadow-sm">
            S
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-brand-800">SAT</span>
            <span className="block text-[10px] text-slate-400 font-medium uppercase tracking-wider">Exam Platform</span>
          </div>
        </div>

        {/* Chức năng chính */}
        <div className="px-4 py-5">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 px-3">
            CHỨC NĂNG
          </div>
          <nav className="space-y-1">
            {mainMenus.map(item => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-brand-50 text-brand-800 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand-800' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-4 bg-brand-800 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Phân hệ Quản trị viên */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-2.5 px-3 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              DÀNH CHO ADMIN
            </div>
            <div className="space-y-1">
              <button
                onClick={() => setActivePage('admin-tools')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activePage === 'admin-tools'
                    ? 'bg-amber-50 text-amber-900 shadow-sm font-bold'
                    : 'text-slate-600 hover:bg-slate-100/70'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-amber-600" />
                <span>Quản trị đề & Mã mời</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cài đặt & Đăng xuất */}
      <div className="p-4 border-t border-slate-100">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-3">
          CÀI ĐẶT
        </div>

        {/* Nút Cài đặt - đã kích hoạt chuyển trang 'settings' */}
        <button
          onClick={() => setActivePage('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activePage === 'settings'
              ? 'bg-brand-50 text-brand-800 shadow-sm'
              : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
          }`}
        >
          <Settings className={`w-4 h-4 ${activePage === 'settings' ? 'text-brand-800' : 'text-slate-400'}`} />
          <span>Cài đặt</span>
          {activePage === 'settings' && (
            <span className="ml-auto w-1.5 h-4 bg-brand-800 rounded-full" />
          )}
        </button>

        {/* Nút Đăng xuất */}
        <button
          onClick={onLogout}
          className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-rose-600 border border-rose-200 rounded-xl hover:bg-rose-50 transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}