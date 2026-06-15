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

  return null;
}
