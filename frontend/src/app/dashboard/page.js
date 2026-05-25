"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

const API = 'http://127.0.0.1:8000';

export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      try {
        const res = await fetch(`${API}/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const user = await res.json();
          if (user.role === 'VP') router.push('/vp');
          else if (user.role === 'MNG') router.push('/manager');
          else if (user.role === 'EMP') router.push('/employee');
          else router.push('/');
        } else {
          router.push('/');
        }
      } catch (err) {
        router.push('/');
      }
    };

    checkAuth();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#020406', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '2rem', color: '#fff' }}>
      <motion.div 
        animate={{ 
          rotate: 360,
          scale: [1, 1.1, 1],
          boxShadow: ["0 0 20px #3b82f6", "0 0 40px #3b82f6", "0 0 20px #3b82f6"]
        }} 
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        style={{ width: 50, height: 50, borderRadius: '50%', border: '3px solid #3b82f6', borderTopColor: 'transparent' }}
      />
      <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#3b82f6', letterSpacing: '0.5em', textTransform: 'uppercase' }}>
        Authorizing Command Access...
      </div>
    </div>
  );
}
