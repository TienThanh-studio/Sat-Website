import { storageService } from './storageService';
import initialCodes from '../data/validCodes.json';

/**
 * authService.js
 * Xử lý xác thực người dùng, kiểm tra mã mời admin, phân quyền RBAC.
 */
export const authService = {
  initCodes() {
    const existing = storageService.get(storageService.KEYS.INVITE_CODES);
    if (!existing) {
      storageService.set(storageService.KEYS.INVITE_CODES, initialCodes);
    }
  },

  getCurrentUser() {
    return storageService.get(storageService.KEYS.CURRENT_USER, {
      id: 'demo-user-01',
      name: 'Phan Tiến Thành',
      email: 'nguyenan20062000@gmail.com',
      role: 'ADMIN' // Mặc định tài khoản demo quyền ADMIN để test toàn diện
    });
  },

  login(email, password) {
    // Giả lập đăng nhập thành công
    const user = {
      id: 'usr_' + Date.now(),
      name: email.split('@')[0],
      email: email,
      role: email.includes('admin') ? 'ADMIN' : 'STUDENT'
    };
    storageService.set(storageService.KEYS.CURRENT_USER, user);
    return { success: true, user };
  },

  register({ name, email, password, inviteCode }) {
    this.initCodes();
    const codes = storageService.get(storageService.KEYS.INVITE_CODES, initialCodes);
    
    // Kiểm tra mã code
    const codeEntry = codes.find(c => c.code.trim().toUpperCase() === inviteCode.trim().toUpperCase());
    if (!codeEntry) {
      return { success: false, message: 'Mã mời không tồn tại trên hệ thống!' };
    }

    if (codeEntry.usedCount >= codeEntry.maxUses) {
      return { success: false, message: 'Mã mời đã hết lượt sử dụng!' };
    }

    // Tăng lượt sử dụng
    codeEntry.usedCount += 1;
    storageService.set(storageService.KEYS.INVITE_CODES, codes);

    const newUser = {
      id: 'usr_' + Date.now(),
      name,
      email,
      role: codeEntry.role // Gán quyền tương ứng mã mời
    };

    storageService.set(storageService.KEYS.CURRENT_USER, newUser);
    return { success: true, user: newUser };
  },

  logout() {
    storageService.remove(storageService.KEYS.CURRENT_USER);
  },

  getInviteCodes() {
    this.initCodes();
    return storageService.get(storageService.KEYS.INVITE_CODES, initialCodes);
  },

  createInviteCode({ code, role, maxUses = 10 }) {
    const codes = this.getInviteCodes();
    const formattedCode = code.trim().toUpperCase();
    if (codes.some(c => c.code === formattedCode)) {
      return { success: false, message: 'Mã mời này đã tồn tại!' };
    }
    const newEntry = {
      code: formattedCode,
      role: role || 'STUDENT',
      usedCount: 0,
      maxUses: Number(maxUses),
      createdAt: new Date().toISOString().split('T')[0]
    };
    codes.push(newEntry);
    storageService.set(storageService.KEYS.INVITE_CODES, codes);
    return { success: true, code: newEntry };
  }
};