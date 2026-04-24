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
                    <div className="text-3xl font-black tracking-tight text-white select-none">
                        FEC<span className="text-brand-primary">Vision</span>
                    </div>

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
                <div className="lg:hidden absolute top-8 left-8 text-2xl font-black tracking-tight text-slate-900">
                    FEC<span className="text-brand-primary">Vision</span>
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
