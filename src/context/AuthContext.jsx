import React, { createContext, useContext, useEffect, useState } from 'react';
import * as authModule from '../services/authService';

// Đảm bảo lấy đúng authService dù export default hay named
const auth = authModule.authService || authModule.default || authModule;

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Kiểm tra phiên đăng nhập hiện tại
    if (typeof auth.getSession === 'function') {
      auth.getSession().then((session) => {
        if (session?.user) {
          setCurrentUser(session.user);
          if (typeof auth.getProfile === 'function') {
            auth.getProfile(session.user.id).then(setProfile).catch(() => {});
          }
        }
        setLoading(false);
      }).catch(() => setLoading(false));
    } else {
      setLoading(false);
    }

    // 2. Lắng nghe thay đổi trạng thái Auth
    let unsubscribe = () => {};
    if (typeof auth.onAuthStateChange === 'function') {
      unsubscribe = auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          setCurrentUser(session.user);
          try {
            if (typeof auth.getProfile === 'function') {
              const p = await auth.getProfile(session.user.id);
              setProfile(p);
            }
          } catch (e) {
            setProfile(null);
          }
        } else {
          setCurrentUser(null);
          setProfile(null);
        }
        setLoading(false);
      });
    }

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Tính trực tiếp trạng thái Premium, không gọi hàm bên ngoài để tránh lỗi function
  const isPremiumUser = Boolean(
    profile &&
    profile.tier === 'premium' &&
    (!profile.premium_until || new Date(profile.premium_until) > new Date())
  );

  const value = {
    currentUser,
    profile,
    loading,
    isAuthenticated: Boolean(currentUser),
    isPremium: isPremiumUser,
    isAdmin: profile?.role === 'admin',
    signIn: auth.signIn ? auth.signIn.bind(auth) : async () => {},
    signUp: auth.signUp ? auth.signUp.bind(auth) : async () => {},
    signInWithGoogle: auth.signInWithGoogle ? auth.signInWithGoogle.bind(auth) : async () => {},
    signOut: auth.signOut ? auth.signOut.bind(auth) : async () => {},
    redeemCode: auth.redeemCode ? auth.redeemCode.bind(auth) : async () => {}
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}