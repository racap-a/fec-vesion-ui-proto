import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../services/api';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await api.post('/auth/forgot-password', { email });
        } catch {
            // Swallow — backend always returns 200
        } finally {
            setIsLoading(false);
            setSubmitted(true); // Always show success
        }
    };

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
                    {submitted ? (
                        <div className="text-center">
                            <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
                                <CheckCircle2 size={28} className="text-emerald-500" />
                            </div>
                            <h2 className="text-xl font-black text-slate-900 mb-2">E-mail envoyé</h2>
                            <p className="text-slate-500 text-sm leading-relaxed">
                                Si cet e-mail est associé à un compte FECVision, vous recevrez un lien de réinitialisation dans quelques minutes.
                            </p>
                            <p className="text-xs text-slate-400 mt-3">Pensez à vérifier vos spams.</p>
                        </div>
                    ) : (
                        <>
                            <div className="mb-7">
                                <h2 className="text-xl font-black text-slate-900 tracking-tight mb-1.5">
                                    Mot de passe oublié ?
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Entrez votre adresse e-mail et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                                </p>
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
                                        Adresse e-mail
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="email"
                                            placeholder="vous@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                                            required
                                        />
                                        <Mail className="absolute left-3.5 top-3 text-slate-400" size={17} />
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
                                        'Envoyer le lien'
                                    )}
                                </button>
                            </form>
                        </>
                    )}
                </div>

                <div className="mt-5 text-center">
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
                    >
                        <ArrowLeft size={15} />
                        Retour à la connexion
                    </Link>
                </div>
            </div>
        </div>
    );
}
