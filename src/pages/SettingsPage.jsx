import React, { useState, useEffect } from 'react';
import { Camera, Save, User, Mail, FileText, CheckCircle2 } from 'lucide-react';

export default function SettingsPage({ currentUser, setCurrentUser }) {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    bio: '',
    avatar: ''
  });
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const user = currentUser || JSON.parse(localStorage.getItem('sat_user') || '{}');
    setProfile({
      name: user.name || 'Học viên SAT',
      email: user.email || 'nguyenan20062000@gmail.com',
      bio: user.bio || 'Mục tiêu Digital SAT 1500+ (Reading & Writing 750+)',
      avatar: user.avatar || ''
    });
  }, [currentUser]);

  // Xử lý chọn ảnh từ máy tính
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Vui lòng chọn ảnh dung lượng dưới 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Lưu thông tin người dùng
  const handleSave = (e) => {
    e.preventDefault();
    const updated = {
      ...(currentUser || {}),
      name: profile.name,
      bio: profile.bio,
      avatar: profile.avatar
    };

    if (typeof setCurrentUser === 'function') {
      setCurrentUser(updated);
    }
    localStorage.setItem('sat_user', JSON.stringify(updated));

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Cài đặt tài khoản</h2>
        <p className="text-xs text-slate-500 mt-1">Quản lý thông tin cá nhân, ảnh đại diện và mục tiêu ôn luyện của bạn.</p>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Thông tin hồ sơ đã được lưu thành công!</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-5 pb-6 border-b border-slate-100">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-slate-200 bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-2xl shadow-sm">
                {profile.avatar ? (
                  <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  profile.name ? profile.name[0].toUpperCase() : 'U'
                )}
              </div>
              <label 
                htmlFor="avatar-upload"
                className="absolute inset-0 bg-black/40 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition"
                title="Thay đổi ảnh"
              >
                <Camera className="w-5 h-5" />
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Ảnh đại diện</h3>
              <p className="text-xs text-slate-400 mt-0.5">Nhấp vào hình tròn để tải ảnh đại diện từ máy tính.</p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Họ và tên
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-800 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                Email đăng ký (Cố định)
              </label>
              <input
                type="email"
                disabled
                value={profile.email}
                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 text-slate-400 rounded-xl text-sm cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                Tiểu sử / Mục tiêu ôn thi
              </label>
              <textarea
                rows="4"
                value={profile.bio}
                placeholder="Nhập đôi nét giới thiệu về bạn hoặc mục tiêu điểm số..."
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-800 focus:outline-none transition resize-none"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-800 hover:bg-brand-900 text-white rounded-xl text-xs font-bold shadow transition active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Lưu thay đổi</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}