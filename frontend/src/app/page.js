"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Terminal } from 'lucide-react';

const API = 'http://127.0.0.1:8000';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [authTab, setAuthTab] = useState('EXISTING');
  const [isBooting, setIsBooting] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleVerifyNew = async (e) => {
    e.preventDefault();
    setScanning(true);
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/auth/verify-new`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email })
      });
      const data = await res.json();
      if (res.ok) {
        setIsSetupMode(true);
        setScanning(false);
      } else {
        setError(data.detail || 'Identity Verification Failed');
        setScanning(false);
      }
    } catch (err) {
      setError('SYSTEM OFFLINE');
      setScanning(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setScanning(true);
    setLoading(true);
    setError('');
    
    // Elite biometric delay
    await new Promise(r => setTimeout(r, 1500));

    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: password })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.is_setup_complete === 0) {
          setIsSetupMode(true);
          setScanning(false);
        } else {
          localStorage.setItem('token', data.access_token);
          localStorage.setItem('user_email', email);
          setIsBooting(true);
          setScanning(false);
          setTimeout(() => {
            if (data.role === 'VP') router.push('/vp');
            else if (data.role === 'MNG') router.push('/manager');
            else if (data.role === 'EMP') router.push('/employee');
            else router.push('/dashboard');
          }, 2200);
        }
      } else {
        setError(data.detail || 'IDENTIFICATION FAILURE');
        setScanning(false);
      }
    } catch (err) {
      setError('SYSTEM OFFLINE');
      setScanning(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/auth/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: newPassword })
      });
      if (res.ok) {
        alert("Account initialized and password created successfully! Please authenticate with your new credentials.");
        setIsSetupMode(false);
        setAuthTab('EXISTING');
        setPassword('');
        setNewPassword('');
      } else {
        const data = await res.json();
        setError(data.detail || 'Setup failed');
      }
    } catch (err) {
      setError('SYSTEM OFFLINE');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', width: '100vw', 
      background: '#040b17', 
      fontFamily: "'Courier New', Courier, monospace",
      color: '#fff',
      display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden'
    }}>

      {/* CSS Keyframes for entrance glow */}
      <style>{`
        @keyframes gridEntrance {
          0%   { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes gridScroll {
          0%   { background-position: 0px 0px; }
          100% { background-position: 40px 40px; }
        }
      `}</style>

      {/* Background layer container */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>

        {/* === 1. BASE STATIC DIM GRID (always visible) === */}
        <div style={{ 
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(59,130,246,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.15) 1px, transparent 1px)', 
          backgroundSize: '40px 40px',
          animation: 'gridEntrance 1.5s ease forwards, gridScroll 8s linear infinite',
          opacity: 0
        }} />

        {/* === 6. HOVER SPOTLIGHT GRID (mouse tracked) === */}
        <div style={{ 
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(0,191,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(0,191,255,0.4) 1px, transparent 1px)', 
          backgroundSize: '40px 40px',
          animation: 'gridScroll 8s linear infinite',
          WebkitMaskImage: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, black, transparent)`,
          maskImage: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, black, transparent)`
        }} />

        {/* === 7. MOUSE AMBIENT GLOW === */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(0,191,255,0.08), transparent 50%)`,
          transition: 'background 0.08s ease'
        }} />

      </div>

      <AnimatePresence>
        {isBooting && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            style={{ position: 'fixed', inset: 0, background: 'rgba(4, 11, 23, 0.95)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
          >
            <div style={{ position: 'relative', width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="100" height="100" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
                 <motion.circle 
                    cx="50" cy="50" r="46" 
                    stroke="#00bfff" 
                    strokeWidth="3" 
                    fill="rgba(0,0,0,0)"
                    strokeDasharray="289"
                    initial={{ strokeDashoffset: 289 }}
                    animate={{ strokeDashoffset: 0 }}
                    transition={{ duration: 2.2, ease: "easeInOut" }}
                    style={{ filter: 'drop-shadow(0 0 10px rgba(0,191,255,0.5))' }}
                 />
              </svg>
              <motion.div 
                animate={{ opacity: [0.4, 1, 0.4], scale: [0.9, 1.1, 0.9] }} 
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <svg width="48" height="48" viewBox="0 0 100 100" fill="#00bfff" style={{ filter: 'drop-shadow(0 0 15px rgba(0, 191, 255, 0.6))' }}>
                   <path d="M50 20 C45 20 40 25 35 35 L20 70 C18 75 22 80 28 78 C35 75 45 70 50 70 C55 70 65 75 72 78 C78 80 82 75 80 70 L65 35 C60 25 55 20 50 20 Z" />
                </svg>
              </motion.div>
            </div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 900, margin: 0, letterSpacing: '0.1em', fontFamily: 'sans-serif' }}>DIGITRAC</h1>
              <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#00bfff', letterSpacing: '0.4em', textTransform: 'uppercase', marginTop: '0.2rem', fontFamily: 'sans-serif' }}>ARCHE</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ Top Navigation ══ */}
      <nav style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 32, height: 32, border: '2px solid rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 100 100" fill="#fff">
               <path d="M50 20 C45 20 40 25 35 35 L20 70 C18 75 22 80 28 78 C35 75 45 70 50 70 C55 70 65 75 72 78 C78 80 82 75 80 70 L65 35 C60 25 55 20 50 20 Z" />
            </svg>
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '0.1em', fontFamily: 'sans-serif' }}>DIGITRAC</span>
        </div>
        


        <div>
          <button style={{ border: '1px solid #00bfff', background: 'transparent', color: '#00bfff', padding: '0.5rem 1.25rem', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', cursor: 'pointer' }}>REQUEST REVIEW</button>
        </div>
      </nav>

      {/* ══ Main Content ══ */}
      <div style={{ flex: 1, display: 'flex', flexWrap: 'nowrap', position: 'relative', zIndex: 10, padding: '0.5rem 2rem', alignItems: 'center', justifyContent: 'space-between', gap: '2rem', overflow: 'hidden' }}>
        
        {/* Left Column (Typography & Auth) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0, maxWidth: '600px', zIndex: 10 }}>
          
          {/* 1. DIGITRAC V4.1 — PRODUCTION */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', overflow: 'hidden' }}>
            <motion.div 
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              style={{ width: '40px', height: '1px', background: '#00bfff', transformOrigin: 'left' }}
            />
            <motion.div 
              initial={{ opacity: 0, letterSpacing: '0.4em' }}
              animate={{ opacity: 1, letterSpacing: '0.2em' }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              style={{ color: '#00bfff', fontSize: '0.65rem', fontWeight: 700, position: 'relative', overflow: 'hidden' }}
            >
              DIGITRAC V4.1 — PRODUCTION
              {/* Scan line */}
              <motion.div
                initial={{ left: '-100%' }}
                animate={{ left: '200%' }}
                transition={{ duration: 1.5, ease: "easeInOut", delay: 0.8 }}
                style={{ position: 'absolute', top: 0, bottom: 0, width: '20px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)', transform: 'skewX(-20deg)' }}
              />
            </motion.div>
          </div>

          {/* 2, 3, 4. Headline */}
          <h1 style={{ 
            fontSize: 'clamp(2rem, 5vw, 3.2rem)', 
            fontWeight: 900, 
            lineHeight: 1, 
            margin: '0 0 1rem 0',
            fontFamily: 'sans-serif',
            letterSpacing: '0.05em',
            whiteSpace: 'nowrap'
          }}>
            <div style={{ overflow: 'hidden', paddingBottom: '0.1em', position: 'relative' }}>
              <motion.div
                initial={{ y: '100%', opacity: 0, filter: 'blur(10px)' }}
                animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
                style={{ display: 'flex', position: 'relative', WebkitBackgroundClip: 'text' }}
              >
                E
                <motion.span
                  initial={{ opacity: 0, rotate: 0 }}
                  animate={{ opacity: 1, rotate: 90 }}
                  transition={{ duration: 1.5, delay: 2.8 }}
                  style={{ display: 'inline-block', originX: 'center', originY: 'center', color: '#00bfff' }}
                >
                  V
                </motion.span>
                ERY PAGE.
                {/* Scan line matching the V rotation */}
                <motion.div
                  initial={{ left: '-20%' }}
                  animate={{ left: '120%' }}
                  transition={{ duration: 1.5, ease: "easeInOut", delay: 2.8 }}
                  style={{ position: 'absolute', top: 0, bottom: 0, width: '100px', background: 'linear-gradient(90deg, transparent, rgba(0,191,255,0.8), transparent)', transform: 'skewX(-20deg)', mixBlendMode: 'lighten', pointerEvents: 'none' }}
                />
              </motion.div>
            </div>
            <div style={{ overflow: 'hidden', paddingBottom: '0.1em', position: 'relative' }}>
              <motion.div
                initial={{ y: '100%', opacity: 0, filter: 'blur(10px)' }}
                animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.9 }}
                style={{ display: 'flex', position: 'relative', WebkitBackgroundClip: 'text' }}
              >
                E
                <motion.span
                  initial={{ opacity: 0, rotate: 0 }}
                  animate={{ opacity: 1, rotate: 90 }}
                  transition={{ duration: 1.5, delay: 3.0 }}
                  style={{ display: 'inline-block', originX: 'center', originY: 'center', color: '#00bfff' }}
                >
                  V
                </motion.span>
                ERY METRIC.
                {/* Scan line matching the V rotation */}
                <motion.div
                  initial={{ left: '-20%' }}
                  animate={{ left: '120%' }}
                  transition={{ duration: 1.5, ease: "easeInOut", delay: 3.0 }}
                  style={{ position: 'absolute', top: 0, bottom: 0, width: '100px', background: 'linear-gradient(90deg, transparent, rgba(0,191,255,0.8), transparent)', transform: 'skewX(-20deg)', mixBlendMode: 'lighten', pointerEvents: 'none' }}
                />
              </motion.div>
            </div>
            <div style={{ overflow: 'hidden', paddingBottom: '0.2em' }}>
              <motion.div
                initial={{ y: '100%', opacity: 0, filter: 'blur(10px)' }}
                animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 1.3 }}
                style={{ color: '#00bfff' }}
              >
                ACCOUNTED FOR.
              </motion.div>
            </div>
          </h1>

          {/* Authentication Form */}
          <div style={{ width: '100%', maxWidth: '450px', marginTop: '1.5rem' }}>
            
            {/* Auth Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              {/* 5. EXISTING MEMBER */}
              <motion.button 
                type="button"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 1.8 }}
                onClick={() => { setAuthTab('EXISTING'); setIsSetupMode(false); setError(''); }}
                style={{ 
                  flex: 1, padding: '0.85rem', 
                  background: authTab === 'EXISTING' ? '#00bfff' : 'rgba(0,191,255,0)', 
                  border: authTab === 'EXISTING' ? 'none' : '1px solid rgba(255,255,255,0.2)', 
                  color: authTab === 'EXISTING' ? '#040b17' : 'rgba(255,255,255,0.6)', 
                  fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em', cursor: 'pointer', transition: 'all 0.3s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  position: 'relative', overflow: 'hidden'
                }}
                whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(0, 191, 255, 0.4)' }}
              >
                {authTab === 'EXISTING' && (
                  <motion.div
                    initial={{ left: '-100%' }}
                    animate={{ left: '200%' }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                    style={{ position: 'absolute', top: 0, bottom: 0, width: '30%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)', transform: 'skewX(-20deg)' }}
                  />
                )}
                EXISTING MEMBER {authTab === 'EXISTING' && <span style={{ fontSize: '1rem' }}>→</span>}
              </motion.button>

              {/* 6. NEW USER */}
              <motion.button 
                type="button"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 2.0 }}
                onClick={() => { setAuthTab('NEW'); setIsSetupMode(false); setError(''); }}
                style={{ 
                  flex: 1, padding: '0.85rem', 
                  background: authTab === 'NEW' ? '#00bfff' : 'rgba(0,191,255,0)', 
                  border: authTab === 'NEW' ? 'none' : '1px solid rgba(255,255,255,0.2)', 
                  color: authTab === 'NEW' ? '#040b17' : 'rgba(255,255,255,0.6)', 
                  fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em', cursor: 'pointer', transition: 'all 0.3s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                }}
                whileHover={{ borderColor: '#00bfff', boxShadow: 'inset 0 0 15px rgba(0,191,255,0.2)', color: '#00bfff' }}
              >
                NEW USER {authTab === 'NEW' && <span style={{ fontSize: '1rem' }}>→</span>}
              </motion.button>
            </div>

            <form onSubmit={isSetupMode ? handleSetup : (authTab === 'EXISTING' ? handleLogin : handleVerifyNew)}>
              
              {/* 7. Access Identifier */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 2.2 }}
                style={{ marginBottom: '1rem', position: 'relative' }}
              >
                <input 
                  type="email" 
                  required
                  placeholder="Access Identifier"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={loading || scanning || isSetupMode}
                  style={{ 
                    width: '100%', padding: '1rem 1.25rem', 
                    background: 'rgba(255,255,255,0.02)', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    color: '#fff', fontSize: '0.85rem', fontFamily: 'monospace',
                    outline: 'none', transition: 'all 0.3s'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#00bfff'; e.target.style.boxShadow = '0 0 15px rgba(0,191,255,0.2)'; e.target.style.background = 'rgba(0,191,255,0.05)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; e.target.style.background = 'rgba(255,255,255,0.02)'; }}
                />
              </motion.div>

              {/* 8. Security Sequence */}
              {(!isSetupMode && authTab === 'EXISTING') && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 2.4 }}
                  style={{ marginBottom: '1.5rem', position: 'relative' }}
                >
                  <input 
                    type="password" 
                    required
                    placeholder="Security Sequence"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={loading || scanning}
                    style={{ 
                      width: '100%', padding: '1rem 1.25rem', 
                      background: 'rgba(255,255,255,0.02)', 
                      border: '1px solid rgba(255,255,255,0.1)', 
                      color: '#fff', fontSize: '0.85rem', fontFamily: 'monospace',
                      outline: 'none', transition: 'all 0.3s'
                    }}
                    onFocus={(e) => { e.target.style.borderColor = '#00bfff'; e.target.style.boxShadow = '0 0 15px rgba(0,191,255,0.2)'; e.target.style.background = 'rgba(0,191,255,0.05)'; }}
                    onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; e.target.style.background = 'rgba(255,255,255,0.02)'; }}
                  />
                </motion.div>
              )}

              {/* New Password for Setup Mode */}
              {isSetupMode && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 2.4 }}
                  style={{ marginBottom: '1.5rem', position: 'relative' }}
                >
                  <input 
                    type="password" 
                    required
                    placeholder="Create Secure Password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    disabled={loading || scanning}
                    style={{ 
                      width: '100%', padding: '1rem 1.25rem', 
                      background: 'rgba(255,255,255,0.02)', 
                      border: '1px solid rgba(255,255,255,0.1)', 
                      color: '#fff', fontSize: '0.85rem', fontFamily: 'monospace',
                      outline: 'none', transition: 'all 0.3s'
                    }}
                    onFocus={(e) => { e.target.style.borderColor = '#00bfff'; e.target.style.boxShadow = '0 0 15px rgba(0,191,255,0.2)'; e.target.style.background = 'rgba(0,191,255,0.05)'; }}
                    onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; e.target.style.background = 'rgba(255,255,255,0.02)'; }}
                  />
                </motion.div>
              )}

              {/* Error Message */}
              {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: '#ef4444', fontSize: '0.75rem', marginBottom: '1rem', fontWeight: 800 }}>{error}</motion.div>}

              {/* 9. INITIALIZE ACCESS */}
              <motion.button 
                type="submit" 
                disabled={loading || scanning}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 2.6 }}
                style={{ 
                  width: '100%', padding: '1rem', 
                  background: scanning ? 'rgba(0,191,255,0.1)' : 'rgba(0,191,255,0)', 
                  border: '1px solid #00bfff', 
                  color: '#00bfff', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.2em', cursor: (loading || scanning) ? 'not-allowed' : 'pointer',
                  position: 'relative', overflow: 'hidden', transition: 'all 0.3s'
                }}
                whileHover={(!loading && !scanning) ? { scale: 1.02, background: 'rgba(0,191,255,0.05)', boxShadow: '0 0 20px rgba(0,191,255,0.4)' } : {}}
              >
                {scanning && (
                  <motion.div
                    initial={{ left: '-100%' }}
                    animate={{ left: '200%' }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    style={{ position: 'absolute', top: 0, bottom: 0, width: '40%', background: 'linear-gradient(90deg, transparent, rgba(0,191,255,0.3), transparent)', zIndex: 0 }}
                  />
                )}
                <span style={{ position: 'relative', zIndex: 1 }}>
                  {scanning ? 'AUTHENTICATING...' : isSetupMode ? 'SET CREDENTIALS' : (authTab === 'EXISTING' ? 'INITIALIZE ACCESS' : 'VERIFY IDENTITY')}
                </span>
              </motion.button>
            </form>
          </div>
        </div>

        {/* Right Column (3D Glowing Document) */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          
          <motion.div 
            initial={{ rotateX: 60, rotateY: 0, rotateZ: -30, scale: 0.8 }}
            animate={{ rotateZ: [-30, -28, -30], y: [0, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            style={{ 
              width: 'min(100%, 350px)', height: 'min(60vh, 400px)', 
              border: '2px solid #00bfff',
              background: 'rgba(0, 191, 255, 0.05)',
              boxShadow: '0 0 40px rgba(0, 191, 255, 0.2), inset 0 0 40px rgba(0, 191, 255, 0.1)',
              position: 'relative',
              transformStyle: 'preserve-3d',
              backdropFilter: 'blur(5px)',
              padding: '2rem 1.5rem',
              overflow: 'hidden'
            }}
          >
            {/* Scanning Laser */}
            <motion.div 
              initial={{ top: '0%' }}
              animate={{ top: ['0%', '100%', '0%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute',
                left: 0,
                width: '100%',
                height: '2px',
                background: '#00bfff',
                boxShadow: '0 0 20px 2px #00bfff, 0 0 40px 5px #00bfff',
                zIndex: 20,
                opacity: 0.8
              }}
            />

            {/* Top Right Fold */}
            <div style={{ position: 'absolute', top: -2, right: -2, width: '40px', height: '40px', borderBottom: '2px solid #00bfff', borderLeft: '2px solid #00bfff', background: '#040b17' }}></div>
            <div style={{ position: 'absolute', top: -2, right: 38, width: '2px', height: '42px', background: '#00bfff' }}></div>
            <div style={{ position: 'absolute', top: 38, right: -2, width: '42px', height: '2px', background: '#00bfff' }}></div>

            {/* Document Lines */}
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ 
                height: '2px', 
                background: i === 1 ? '#00bfff' : 'rgba(0, 191, 255, 0.4)', 
                width: i % 2 === 0 ? '80%' : '100%', 
                marginBottom: '2.5rem',
                boxShadow: i === 1 ? '0 0 10px #00bfff' : 'none'
              }}></div>
            ))}
            
            {/* Bottom Graphic Lines */}
            <div style={{ height: '2px', background: 'rgba(0, 191, 255, 0.4)', width: '60%', marginBottom: '2.5rem' }}></div>
            <div style={{ height: '2px', background: 'rgba(0, 191, 255, 0.4)', width: '90%', marginBottom: '3rem' }}></div>

            {/* VERIFIED Stamp */}
            <div style={{ border: '2px solid #00bfff', color: '#00bfff', padding: '0.5rem 1rem', width: 'fit-content', fontSize: '0.8rem', letterSpacing: '0.2em', fontWeight: 800, fontFamily: 'monospace' }}>
              VERIFIED
            </div>

            {/* Bottom Right Corner Reticle */}
            <div style={{ position: 'absolute', bottom: '20px', right: '20px', width: '20px', height: '20px', borderBottom: '2px solid #00bfff', borderRight: '2px solid #00bfff' }}></div>

            {/* Internal Glow Effect */}
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 50%, rgba(0, 191, 255, 0.1) 0%, transparent 70%)', pointerEvents: 'none' }}></div>
          </motion.div>

        </div>
      </div>
      
    </div>
  );
}
