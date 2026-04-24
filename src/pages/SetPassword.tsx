import { useState } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import api from '../services/api';

export default function SetPassword() {
    const [searchParams] = useSearchParams();
    const { pathname } = useLocation();
    const token = searchParams.get('token') ?? '';

    const isFirstLogin = pathname.startsWith('/set-password');
    const title = isFirstLogin ? 'Définissez votre mot de passe' : 'Nouveau mot de passe';
    const subtitle = isFirstLogin
        ? 'Bienvenue sur FECVision. Choisissez un mot de passe pour activer votre compte.'
        : 'Choisissez un nouveau mot de passe pour votre compte.';

    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 8) {
            setError('Le mot de passe doit contenir au moins 8 caractères.');
            return;
        }
        if (password !== confirm) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }

        setIsLoading(true);
        try {
            await api.post('/auth/reset-password', { token, newPassword: password });
            setSuccess(true);
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                'Lien invalide ou expiré. Demandez un nouveau lien.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-sm w-full text-center">
                    <AlertCircle size={40} className="text-red-400 mx-auto mb-4" />
                    <h2 className="text-lg font-black text-slate-900 mb-2">Lien invalide</h2>
                    <p className="text-sm text-slate-500 mb-6">Ce lien est incomplet ou a expiré.</p>
                    <Link to="/forgot-password" className="text-brand-primary font-semibold text-sm hover:underline">
                        Demander un nouveau lien
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
            <div className="w-full max-w-[400px]">

                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="text-2xl font-black tracking-tight text-slate-900 select-none">
                        FEC<span className="text-brand-primary">Vision</span>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                    {success ? (
                        <div className="text-center">
                            <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
                                <CheckCircle2 size={28} className="text-emerald-500" />
                            </div>
                            <h2 className="text-xl font-black text-slate-900 mb-2">Mot de passe défini</h2>
                            <p className="text-slate-500 text-sm mb-6">
                                Votre mot de passe a été enregistré. Vous pouvez maintenant vous connecter.
                            </p>
                            <Link
                                to="/login"
                                className="inline-block w-full bg-brand-primary text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors text-sm text-center"
                            >
                                Se connecter
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="mb-7">
                                <h2 className="text-xl font-black text-slate-900 tracking-tight mb-1.5">{title}</h2>
                                <p className="text-sm text-slate-500">{subtitle}</p>
                            </div>

                            {error && (
                                <div className="mb-5 p-3.5 bg-red-50 text-red-600 text-sm rounded-xl flex items-center gap-2.5 border border-red-100">
                                    <AlertCircle size={16} className="shrink-0" />
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                        Nouveau mot de passe
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="8 caractères minimum"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                                            required
                                        />
                                        <Lock className="absolute left-3.5 top-3 text-slate-400" size={17} />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(p => !p)}
                                            className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                                        >
                                            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                        Confirmer le mot de passe
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Répétez le mot de passe"
                                            value={confirm}
                                            onChange={(e) => setConfirm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                                            required
                                        />
                                        <Lock className="absolute left-3.5 top-3 text-slate-400" size={17} />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-brand-primary text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-brand-primary/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                >
                                    {isLoading ? (
                                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        'Enregistrer le mot de passe'
                                    )}
                                </button>
                            </form>
                        </>
                    )}
                </div>

                {!success && (
                    <div className="mt-5 text-center">
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
                        >
                            <ArrowLeft size={15} />
                            Retour à la connexion
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
