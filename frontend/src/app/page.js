"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ChevronRight, Cpu, Shield, Activity, Fingerprint, Target, Terminal } from 'lucide-react';

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
    <div style={{ minHeight: '100vh', width: '100vw', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflowY: 'auto', boxSizing: 'border-box', padding: '1.5rem', color: '#fff' }}>
      
      {/* ══ Background ══ */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.05) 0%, rgba(0,0,0,0) 50%)' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.01) 1px, rgba(0,0,0,0) 1px), linear-gradient(90deg, rgba(255,255,255,0.01) 1px, rgba(0,0,0,0) 1px)', backgroundSize: '60px 60px' }} />
      </div>

      <AnimatePresence>
        {isBooting && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.95)', backdropFilter: 'blur(30px)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
          >
            <div style={{ position: 'relative', width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="100" height="100" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
                 <motion.circle 
                    cx="50" cy="50" r="46" 
                    stroke="#00ffc8" 
                    strokeWidth="3" 
                    fill="rgba(0,0,0,0)"
                    strokeDasharray="289"
                    initial={{ strokeDashoffset: 289 }}
                    animate={{ strokeDashoffset: 0 }}
                    transition={{ duration: 2.2, ease: "easeInOut" }}
                    style={{ filter: 'drop-shadow(0 0 10px rgba(0,255,200,0.5))' }}
                 />
              </svg>
              <motion.div 
                animate={{ opacity: [0.4, 1, 0.4], scale: [0.9, 1.1, 0.9] }} 
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <svg width="48" height="48" viewBox="0 0 100 100" fill="#00ffc8" style={{ filter: 'drop-shadow(0 0 15px rgba(0, 255, 200, 0.6))' }}>
                   <path d="M50 20 C45 20 40 25 35 35 L20 70 C18 75 22 80 28 78 C35 75 45 70 50 70 C55 70 65 75 72 78 C78 80 82 75 80 70 L65 35 C60 25 55 20 50 20 Z" />
                </svg>
              </motion.div>
            </div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em', background: 'linear-gradient(to bottom, #fff 50%, rgba(0,255,200,0.4))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'rgba(0,0,0,0)' }}>DIGITRAC</h1>
              <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#00ffc8', letterSpacing: '0.4em', textTransform: 'uppercase', marginTop: '0.2rem' }}>ARCHE</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '440px', margin: 'auto' }}>
        
        {/* Brand Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ width: 40, height: 40, background: 'rgba(0,0,0,0)', border: '2px solid rgba(0,255,200,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(0, 255, 200, 0.1)', marginBottom: '0.5rem' }}>
            <svg width="20" height="20" viewBox="0 0 100 100" fill="#00ffc8">
               <path d="M50 20 C45 20 40 25 35 35 L20 70 C18 75 22 80 28 78 C35 75 45 70 50 70 C55 70 65 75 72 78 C78 80 82 75 80 70 L65 35 C60 25 55 20 50 20 Z" />
            </svg>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em', background: 'linear-gradient(to bottom, #fff 50%, rgba(0,255,200,0.4))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'rgba(0,0,0,0)' }}>DIGITRAC</h1>
          <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#00ffc8', letterSpacing: '0.4em', textTransform: 'uppercase', marginTop: '0.2rem' }}>ARCHE</div>
        </div>

        {/* Auth Card */}
        <div style={{ position: 'relative', background: 'rgba(255,255,255,0.01)', backdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '1.25rem', padding: '1.5rem 2rem', boxShadow: '0 40px 100px rgba(0,0,0,0.8)' }}>
          
          {/* Auth Tab Selectors */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', background: 'rgba(255,255,255,0.02)', padding: '0.3rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
            <button 
              type="button"
              onClick={() => { setAuthTab('EXISTING'); setIsSetupMode(false); setError(''); }}
              style={{ flex: 1, padding: '0.75rem', background: authTab === 'EXISTING' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(0,0,0,0)', border: authTab === 'EXISTING' ? '1px solid #3b82f6' : 'none', color: authTab === 'EXISTING' ? '#fff' : '#8896ab', borderRadius: '0.5rem', fontSize: '0.7rem', fontWeight: 900, cursor: 'pointer', transition: 'all 0.2s' }}>
              EXISTING MEMBER
            </button>
            <button 
              type="button"
              onClick={() => { setAuthTab('NEW'); setIsSetupMode(false); setError(''); }}
              style={{ flex: 1, padding: '0.75rem', background: authTab === 'NEW' ? 'rgba(0, 255, 200, 0.2)' : 'rgba(0,0,0,0)', border: authTab === 'NEW' ? '1px solid #00ffc8' : 'none', color: authTab === 'NEW' ? '#fff' : '#8896ab', borderRadius: '0.5rem', fontSize: '0.7rem', fontWeight: 900, cursor: 'pointer', transition: 'all 0.2s' }}>
              NEW USER
            </button>
          </div>

          {scanning && (
            <motion.div initial={{ top: '0%' }} animate={{ top: '100%' }} transition={{ duration: 1.5, repeat: 0, ease: 'linear' }}
              style={{ position: 'absolute', left: 0, width: '100%', height: '2px', background: 'linear-gradient(to right, rgba(0,0,0,0), #3b82f6, rgba(0,0,0,0))', boxShadow: '0 0 15px #3b82f6', zIndex: 10 }}
            />
          )}

          {isSetupMode ? (
            <form onSubmit={handleSetup} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ color: '#00ffc8', fontSize: '0.7rem', fontWeight: 800, textAlign: 'center' }}>
                FIRST-TIME LOGIN DETECTED
              </div>
              <div style={{ color: '#8896ab', fontSize: '0.6rem', textAlign: 'center', marginBottom: '0.2rem' }}>
                Please create a permanent secure password for your Arche Global identity.
              </div>
              <input 
                type="email" value={email} disabled
                style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '0.4rem', padding: '0.75rem 0.85rem', fontSize: '0.75rem', color: '#8896ab', outline: 'none', cursor: 'not-allowed', boxSizing: 'border-box' }}
              />
              <input 
                type="password" placeholder="Create Secure Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(0,255,200,0.3)', borderBottom: '2px solid rgba(0,255,200,0.6)', borderRadius: '0.4rem', padding: '0.75rem 0.85rem', fontSize: '0.75rem', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
                required
              />
              {error && <div style={{ color: '#fca5a5', fontSize: '0.6rem', fontWeight: 900, textAlign: 'center', background: 'rgba(239, 68, 68, 0.05)', padding: '0.5rem', borderRadius: '0.4rem', border: '1px solid rgba(239, 68, 68, 0.1)' }}>{error}</div>}
              <motion.button whileHover={{ scale: 1.02, background: '#00ffc8', color: '#000' }} whileTap={{ scale: 0.98 }} disabled={loading}
                style={{ width: '100%', background: 'rgba(0,0,0,0)', border: '1px solid #00ffc8', color: '#00ffc8', padding: '0.75rem 0.85rem', borderRadius: '0.4rem', fontSize: '0.75rem', fontWeight: 900, cursor: 'pointer', letterSpacing: '0.15em', transition: 'all 0.3s', boxSizing: 'border-box' }}>
                {loading ? 'PROCESSING...' : 'INITIALIZE ACCOUNT'}
              </motion.button>
            </form>
          ) : authTab === 'NEW' ? (
            <form onSubmit={handleVerifyNew} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ color: '#00ffc8', fontSize: '0.7rem', fontWeight: 800, textAlign: 'center' }}>
                NEW USER REGISTRATION
              </div>
              <div style={{ color: '#8896ab', fontSize: '0.6rem', textAlign: 'center', marginBottom: '0.2rem' }}>
                Enter your Arche Global identity to verify your project assignment.
              </div>
              <input 
                type="email" placeholder="Access Identifier (e.g., as@arche.global)" value={email} onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(0,255,200,0.3)', borderBottom: '2px solid rgba(0,255,200,0.6)', borderRadius: '0.4rem', padding: '0.75rem 0.85rem', fontSize: '0.75rem', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
                required
              />
              {error && <div style={{ color: '#fca5a5', fontSize: '0.6rem', fontWeight: 900, textAlign: 'center', background: 'rgba(239, 68, 68, 0.05)', padding: '0.5rem', borderRadius: '0.4rem', border: '1px solid rgba(239, 68, 68, 0.1)' }}>{error}</div>}
              <motion.button whileHover={{ scale: 1.02, background: '#00ffc8', color: '#000' }} whileTap={{ scale: 0.98 }} disabled={loading}
                style={{ width: '100%', background: 'rgba(0,0,0,0)', border: '1px solid #00ffc8', color: '#00ffc8', padding: '0.75rem 0.85rem', borderRadius: '0.4rem', fontSize: '0.75rem', fontWeight: 900, cursor: 'pointer', letterSpacing: '0.15em', transition: 'all 0.3s', boxSizing: 'border-box' }}>
                {loading ? 'VERIFYING...' : 'VERIFY ASSIGNMENT'}
              </motion.button>
            </form>
          ) : (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input 
                type="email" placeholder="Access Identifier" value={email} onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderBottom: '2px solid rgba(255,255,255,0.1)', borderRadius: '0.4rem', padding: '0.75rem 0.85rem', fontSize: '0.75rem', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
                required
              />
              <input 
                type="password" placeholder="Security Sequence" value={password} onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderBottom: '2px solid rgba(255,255,255,0.1)', borderRadius: '0.4rem', padding: '0.75rem 0.85rem', fontSize: '0.75rem', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
                required
              />
              {error && <div style={{ color: '#fca5a5', fontSize: '0.6rem', fontWeight: 900, textAlign: 'center', background: 'rgba(239, 68, 68, 0.05)', padding: '0.5rem', borderRadius: '0.4rem', border: '1px solid rgba(239, 68, 68, 0.1)' }}>{error}</div>}
              <motion.button whileHover={{ scale: 1.02, background: '#fff', color: '#000' }} whileTap={{ scale: 0.98 }} disabled={loading}
                style={{ width: '100%', background: 'rgba(0,0,0,0)', border: '1px solid #3b82f6', color: '#3b82f6', padding: '0.75rem 0.85rem', borderRadius: '0.4rem', fontSize: '0.75rem', fontWeight: 900, cursor: 'pointer', letterSpacing: '0.15em', transition: 'all 0.3s', boxSizing: 'border-box' }}>
                {loading ? 'AUTHENTICATING...' : 'INITIALIZE ACCESS'}
              </motion.button>
            </form>
          )}

          {/* Elite Access Terminal Box */}
          <div style={{ marginTop: '1.25rem', background: 'rgba(59, 130, 246, 0.03)', border: '1px solid rgba(59, 130, 246, 0.1)', borderRadius: '0.5rem', padding: '0.75rem' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', borderBottom: '1px solid rgba(59, 130, 246, 0.1)', paddingBottom: '0.4rem' }}>
                <Terminal size={12} color="#3b82f6" />
                <span style={{ fontSize: '0.55rem', fontWeight: 900, color: '#3b82f6', letterSpacing: '0.1em' }}>AUTHORIZED ACCESS NODES</span>
             </div>
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                <div style={{ textAlign: 'center' }}>
                   <div style={{ fontSize: '0.5rem', color: '#3b82f6', fontWeight: 900, marginBottom: '0.1rem' }}>EXEC</div>
                   <div style={{ fontSize: '0.45rem', color: 'rgba(255,255,255,0.3)' }}>vp@digitrac.com</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                   <div style={{ fontSize: '0.5rem', color: '#3b82f6', fontWeight: 900, marginBottom: '0.1rem' }}>MNGR</div>
                   <div style={{ fontSize: '0.45rem', color: 'rgba(255,255,255,0.3)' }}>manager@digitrac.com</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                   <div style={{ fontSize: '0.5rem', color: '#3b82f6', fontWeight: 900, marginBottom: '0.1rem' }}>EMP</div>
                   <div style={{ fontSize: '0.45rem', color: 'rgba(255,255,255,0.3)' }}>employee@digitrac.com</div>
                </div>
             </div>
             <div style={{ marginTop: '0.5rem', textAlign: 'center', fontSize: '0.4rem', color: 'rgba(59, 130, 246, 0.3)', fontWeight: 800 }}>SECURITY SEQUENCE: [ROLE]123</div>
          </div>
        </div>

      </motion.div>

    </div>
  );
}
