import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, User, Lock, AlertCircle, UploadCloud, Map, BarChart3, Database } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await api.post('/auth/login', { username, password });
            // API returns: { token, username, fullName, role, companyId, ... }
            const { token, ...userData } = response.data;

            login(token, userData);
            navigate('/'); // Redirect to dashboard
        } catch (err: any) {
            console.error('Login failed', err);
            setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const features = [
        { icon: UploadCloud, text: "Ingestion automatique des fichiers FEC" },
        { icon: Map,         text: "Mapping PCG intelligent par glisser-déposer" },
        { icon: BarChart3,   text: "Compte de résultat généré par l'IA" },
    ];

    return (
        <div className="h-full min-h-screen flex">

            {/* ── Left panel — Brand ── */}
            <div className="hidden lg:flex lg:w-[58%] bg-brand-dark relative overflow-hidden flex-col">
                {/* Background layers */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_0%_0%,rgba(37,99,235,0.18)_0%,transparent_70%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_100%_100%,rgba(16,185,129,0.10)_0%,transparent_70%)]" />
                <div
                    className="absolute inset-0 opacity-[0.07]"
                    style={{ backgroundImage: 'radial-gradient(circle, #475569 1px, transparent 1px)', backgroundSize: '28px 28px' }}
                />

                <div className="relative z-10 flex flex-col h-full p-12">
                    {/* Logo */}
                    <svg viewBox="0 0 444.48 96.68" className="h-10 w-auto" aria-label="FECVision" role="img">
                        <g>
                            <path fill="#ffffff" d="M52.9,12.12v9.12H20.51v23.06h25.68v9.12h-25.68v30.92h-9.75V12.12h42.14Z"/>
                            <path fill="#ffffff" d="M108.66,12.12v9.12h-33.02v23.06h28.83v9.12h-28.83v21.8h34.07v9.12h-43.82V12.12h42.77Z"/>
                            <path fill="#ffffff" d="M182.78,72.92c-6.39,7.65-16.04,12.47-27.36,12.47-20.44,0-36.58-16.46-36.58-37s16.14-37.11,36.58-37.11c11.22,0,20.76,4.72,27.15,12.27l-7.34,6.08c-4.93-5.35-11.85-8.91-19.81-8.91-15.2,0-26.84,12.27-26.84,27.67s11.64,27.57,26.84,27.57c8.07,0,15.09-3.46,20.02-9.22l7.34,6.19Z"/>
                            <path fill="#ffffff" d="M229.84,35.39h5.14l-20.65,48.96h-5.56l-20.55-48.96h5.14l18.14,43.61,18.34-43.61Z"/>
                            <path fill="#ffffff" d="M248.92,13.38c2.41,0,4.09,1.68,4.09,3.88s-1.68,3.88-4.09,3.88-4.19-1.68-4.19-3.88,1.78-3.88,4.19-3.88ZM251.33,35.39v48.96h-4.72v-48.96h4.72Z"/>
                            <path fill="#ffffff" d="M297.56,46.61h-4.72c-.84-4.72-5.03-7.65-10.38-7.65s-10.06,2.94-10.8,7.13c-.84,6.81,4.4,9.22,8.49,10.06l7.02,1.68c8.91,2.2,12.05,7.34,12.05,13.52,0,8.39-7.02,14.05-17.19,14.05-7.97,0-16.04-4.72-17.19-13.52h4.4c1.36,3.88,4.4,8.91,13.1,8.91,7.55,0,12.16-3.67,12.16-9.43,0-3.88-2.1-7.34-8.39-8.91l-7.13-1.68c-5.87-1.36-13.21-4.3-12.06-15.31.84-6.71,7.86-11.11,15.51-11.11s14.15,4.19,15.1,12.26Z"/>
                            <path fill="#ffffff" d="M315.48,13.38c2.41,0,4.09,1.68,4.09,3.88s-1.68,3.88-4.09,3.88-4.19-1.68-4.19-3.88,1.78-3.88,4.19-3.88ZM317.89,35.39v48.96h-4.72v-48.96h4.72Z"/>
                            <path fill="#ffffff" d="M392.1,35.39h4.82v9.64c2.83-7.86,10.59-10.69,17.3-10.69,11.74,0,19.5,8.18,19.5,21.28v28.72h-4.72v-28.72c0-10.38-5.98-16.56-14.78-16.56s-16.98,4.82-17.3,17.82v27.46h-4.82v-48.96Z"/>
                        </g>
                        <g>
                            <path fill="#ffffff" d="M354.75,80.48c-11.8,0-21.74-8.63-21.74-21.85,0-11.31,7.39-19.13,17-21.06l-.11-4.99c-12.28,2.02-21.81,11.72-21.81,26.05,0,16.17,12.13,26.77,26.66,26.77,13.45,0,24.84-9.08,26.45-23.26l-5.04.56c-1.81,10.89-10.87,17.78-21.41,17.78Z"/>
                            <path fill="#f4c868" d="M353,37.17l-.11-4.93s14.28-1.63,23,9.68c0,0,6.41,8.73,5.51,17.19l-4.94.55s1.29-23.02-23.46-22.49Z"/>
                        </g>
                    </svg>

                    {/* Hero copy */}
                    <div className="flex-1 flex flex-col justify-center max-w-[420px]">
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-primary/10 border border-brand-primary/20 rounded-full text-brand-primary text-[11px] font-bold uppercase tracking-widest mb-6 w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
                            Plateforme SaaS comptable
                        </span>

                        <h1 className="text-5xl font-black text-white leading-[1.1] tracking-tight mb-5">
                            Pilotez vos&nbsp;<span className="text-brand-primary">FEC</span><br />
                            en toute clarté.
                        </h1>

                        <p className="text-slate-400 text-base leading-relaxed mb-12">
                            Ingestion, mapping PCG et compte de résultat IA —<br />
                            automatisés pour les cabinets comptables modernes.
                        </p>

                        <div className="space-y-3.5">
                            {features.map(({ icon: Icon, text }) => (
                                <div key={text} className="flex items-center gap-3.5">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                                        <Icon size={15} className="text-emerald-400" />
                                    </div>
                                    <span className="text-slate-300 text-sm font-medium">{text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center gap-2 text-[11px] text-slate-600 font-mono">
                        <Database size={11} />
                        kpiweb154.exe — Engine v1.2
                        <span className="ml-auto">© 2026 KpiWeb</span>
                    </div>
                </div>
            </div>

            {/* ── Right panel — Form ── */}
            <div className="flex-1 flex flex-col items-center justify-center bg-white px-8 py-12 relative">
                {/* Mobile logo */}
                <div className="lg:hidden absolute top-8 left-8">
                    <img src="/logo-FECvision_Logo bleu et jaune.svg" alt="FECVision" className="h-8 w-auto" />
                </div>

                <div className="w-full max-w-[360px]">
                    <div className="mb-9">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-1.5">Bienvenue</h2>
                        <p className="text-slate-500 text-sm">Connectez-vous à votre espace de travail.</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-3.5 bg-red-50 text-red-600 text-sm rounded-xl flex items-center gap-2.5 border border-red-100">
                            <AlertCircle size={16} className="shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Identifiant</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Entrez votre identifiant"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-slate-900 bg-white text-sm placeholder:text-slate-400"
                                    required
                                />
                                <User className="absolute left-3.5 top-3 text-slate-400" size={17} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mot de passe</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-slate-900 bg-white text-sm placeholder:text-slate-400"
                                    required
                                />
                                <Lock className="absolute left-3.5 top-3 text-slate-400" size={17} />
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm pt-0.5">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" className="rounded border-slate-300 text-brand-primary focus:ring-brand-primary" />
                                <span className="text-slate-500">Se souvenir de moi</span>
                            </label>
                            <Link to="/forgot-password" className="text-brand-primary font-semibold hover:underline text-sm">
                                Mot de passe oublié ?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-brand-primary text-white py-3 rounded-xl font-bold hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-lg shadow-brand-primary/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                            {isLoading ? (
                                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <LogIn size={17} />
                                    Se connecter
                                </>
                            )}
                        </button>
                    </form>

                    <p className="mt-10 text-center text-xs text-slate-400">
                        © 2026 FECVision · KpiWeb
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
