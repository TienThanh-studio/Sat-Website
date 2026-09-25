import React, { useState, useEffect } from 'react';
import { getCurrentUser, updateUserProfile } from '../services/authService';

export default function SettingsPage() {
  const [user, setUser] = useState({ name: '', email: '', bio: '', avatar: '' });
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const current = getCurrentUser() || JSON.parse(localStorage.getItem('currentUser')) || {};
    setUser({
      name: current.name || 'Học viên SAT',
      email: current.email || '',
      bio: current.bio || 'Mục tiêu SAT 1500+ Digital SAT',
      avatar: current.avatar || ''
    });
  }, []);

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUser((prev) => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    // Lưu vào LocalStorage hoặc Backend
    localStorage.setItem('currentUser', JSON.stringify(user));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl border border-gray-100 shadow-sm mt-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Cài đặt thông tin cá nhân</h2>
      
      {isSaved && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl">
          Đã lưu thông tin cài đặt thành công!
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Đổi ảnh đại diện */}
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-indigo-100 bg-gray-50 flex items-center justify-center text-gray-400 font-bold text-xl">
            {user.avatar ? (
              <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              user.name ? user.name[0].toUpperCase() : 'U'
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ảnh đại diện</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleAvatarUpload}
              className="text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
            />
          </div>
        </div>

        {/* Họ tên */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
          <input
            type="text"
            value={user.name}
            onChange={(e) => setUser({ ...user, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        {/* Tiểu sử (Bio) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tiểu sử cá nhân</label>
          <textarea
            rows="4"
            value={user.bio}
            placeholder="Chia sẻ đôi điều về bạn và mục tiêu học tập..."
            onChange={(e) => setUser({ ...user, bio: e.target.value })}
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
          />
        </div>

        <button
          type="submit"
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition"
        >
          Lưu thay đổi
        </button>
      </form>
    </div>
  );
}