import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const Login = () => {
    const [mode, setMode] = useState('loading');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/auth/needs-setup')
            .then(res => setMode(res.data.needsSetup ? 'setup' : 'login'))
            .catch(() => setMode('login'));
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(username, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSetup = async (e) => {
        e.preventDefault();
        setError('');
        if (password !== confirmPassword) return setError('Passwords do not match.');
        setLoading(true);
        try {
            await api.post('/auth/register', { username, password });
            setSuccess('Admin account created! You can now sign in.');
            setMode('login');
            setPassword('');
            setConfirmPassword('');
        } catch (err) {
            setError(err.response?.data?.error || 'Setup failed.');
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full pl-12 pr-4 py-3 rounded-xl border transition-all bg-[#1a1714] text-white placeholder-gray-500 focus:outline-none";
    const inputStyle = { borderColor: 'rgba(196,127,23,0.25)', color: '#fff' };
    const inputFocusHandlers = {
        onFocus: e => { e.currentTarget.style.borderColor = '#c47f17'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(196,127,23,0.15)'; },
        onBlur:  e => { e.currentTarget.style.borderColor = 'rgba(196,127,23,0.25)'; e.currentTarget.style.boxShadow = 'none'; },
    };

    if (mode === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#0e0e14' }}>
                <div className="w-10 h-10 rounded-full animate-spin" style={{ border: '3px solid #c47f17', borderTopColor: 'transparent' }}></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: '#0e0e14' }}>

            {/* Background glows */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-60 -right-60 w-96 h-96 rounded-full blur-3xl" style={{ background: 'rgba(196,127,23,0.08)' }}></div>
                <div className="absolute -bottom-60 -left-60 w-96 h-96 rounded-full blur-3xl" style={{ background: 'rgba(196,127,23,0.06)' }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-3xl" style={{ background: 'rgba(196,127,23,0.03)' }}></div>
            </div>

            <div className="w-full max-w-md relative animate-fade-in">

                {/* Card */}
                <div className="rounded-2xl p-8" style={{ background: '#13120f', border: '1px solid rgba(196,127,23,0.18)', boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}>

                    {/* Logo */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
                            style={{ background: 'linear-gradient(135deg, #c47f17, #a86c10)', boxShadow: '0 4px 20px rgba(196,127,23,0.4)' }}>
                            <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 17h8M8 17v-4m8 4v-4m-8 0h8m-8 0V9a4 4 0 014-4h0a4 4 0 014 4v4" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#f5f0e8' }}>Jifs Company</h1>
                        <p className="mt-1 text-sm" style={{ color: '#6b6660' }}>Gen Supp Ltd</p>
                    </div>

                    {/* Setup banner */}
                    {mode === 'setup' && (
                        <div className="mb-6 p-4 rounded-xl text-center" style={{ background: 'rgba(196,127,23,0.08)', border: '1px solid rgba(196,127,23,0.2)' }}>
                            <p className="font-semibold text-sm" style={{ color: '#c47f17' }}>Welcome! First-Time Setup</p>
                            <p className="text-xs mt-1" style={{ color: '#a86c10' }}>Create the main Admin account to get started.</p>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="mb-5 p-4 rounded-xl flex items-center gap-3 animate-fade-in" style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)' }}>
                            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(220,38,38,0.15)' }}>
                                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-red-400 text-sm font-medium">{error}</p>
                        </div>
                    )}

                    {/* Success */}
                    {success && (
                        <div className="mb-5 p-4 rounded-xl flex items-center gap-3 animate-fade-in" style={{ background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.2)' }}>
                            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(5,150,105,0.15)' }}>
                                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <p className="text-emerald-400 text-sm font-medium">{success}</p>
                        </div>
                    )}

                    {/* ── LOGIN FORM ── */}
                    {mode === 'login' && (
                        <form onSubmit={handleLogin} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold mb-2" style={{ color: '#a09890' }}>Username</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <svg className="w-5 h-5" style={{ color: '#6b6660' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                                        placeholder="Enter your username"
                                        className={inputClass} style={inputStyle}
                                        {...inputFocusHandlers}
                                        required autoComplete="username" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2" style={{ color: '#a09890' }}>Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <svg className="w-5 h-5" style={{ color: '#6b6660' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        className={inputClass} style={inputStyle}
                                        {...inputFocusHandlers}
                                        required autoComplete="current-password" />
                                </div>
                            </div>
                            <button type="submit" disabled={loading}
                                className="w-full py-3.5 px-4 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                                style={{ background: 'linear-gradient(135deg, #c47f17, #a86c10)', boxShadow: '0 4px 16px rgba(196,127,23,0.4)' }}
                                onMouseEnter={e => { if (!loading) e.currentTarget.style.boxShadow = '0 6px 24px rgba(196,127,23,0.55)'; }}
                                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(196,127,23,0.4)'; }}>
                                {loading ? (
                                    <><div className="w-5 h-5 rounded-full animate-spin" style={{ border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }}></div>Signing in...</>
                                ) : (
                                    <>Sign In <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg></>
                                )}
                            </button>
                        </form>
                    )}

                    {/* ── SETUP FORM ── */}
                    {mode === 'setup' && (
                        <form onSubmit={handleSetup} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold mb-2" style={{ color: '#a09890' }}>Choose a Username</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <svg className="w-5 h-5" style={{ color: '#6b6660' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                                        placeholder="e.g. admin or your name"
                                        className={inputClass} style={inputStyle}
                                        {...inputFocusHandlers}
                                        required autoComplete="off" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2" style={{ color: '#a09890' }}>Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <svg className="w-5 h-5" style={{ color: '#6b6660' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                                        placeholder="Min 8 characters, include a number"
                                        className={inputClass} style={inputStyle}
                                        {...inputFocusHandlers}
                                        required autoComplete="new-password" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2" style={{ color: '#a09890' }}>Confirm Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <svg className="w-5 h-5" style={{ color: '#6b6660' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                                        placeholder="Type the password again"
                                        className={inputClass} style={inputStyle}
                                        {...inputFocusHandlers}
                                        required autoComplete="new-password" />
                                </div>
                            </div>
                            <div className="rounded-xl p-3 text-xs" style={{ background: 'rgba(196,127,23,0.08)', border: '1px solid rgba(196,127,23,0.2)', color: '#a86c10' }}>
                                <strong style={{ color: '#c47f17' }}>Write down your username and password</strong> and keep them safe. This is the main Admin account — if you forget it, you will not be able to access the system.
                            </div>
                            <button type="submit" disabled={loading}
                                className="w-full py-3.5 px-4 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                                style={{ background: 'linear-gradient(135deg, #059669, #047857)', boxShadow: '0 4px 16px rgba(5,150,105,0.35)' }}>
                                {loading ? (
                                    <><div className="w-5 h-5 rounded-full animate-spin" style={{ border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }}></div>Creating account...</>
                                ) : (
                                    <>Create Admin Account <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></>
                                )}
                            </button>
                        </form>
                    )}
                </div>

                <p className="text-center text-sm mt-6" style={{ color: '#3a3730' }}>
                    © 2026 Jifs Company &amp; Gen Supp Ltd. All rights reserved.
                </p>
            </div>
        </div>
    );
};

export default Login;
