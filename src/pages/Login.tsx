import { LogIn, User } from 'lucide-react';

const Login = () => {
    return (
        <div className="h-full flex items-center justify-center bg-slate-50">
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="text-2xl font-bold mb-2 tracking-tight text-slate-900">
                        FEC<span className="text-brand-primary">Vision</span>
                    </div>
                    <p className="text-slate-500">Sign in to your account</p>
                </div>

                <form className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <div className="relative">
                            <input
                                type="email"
                                placeholder="name@company.com"
                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                            />
                            <User className="absolute left-3 top-2.5 text-slate-400" size={20} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                        />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <label className="flex items-center gap-2">
                            <input type="checkbox" className="rounded border-slate-300 text-brand-primary focus:ring-brand-primary" />
                            <span className="text-slate-600">Remember me</span>
                        </label>
                        <a href="#" className="text-brand-primary font-medium hover:underline">Forgot password?</a>
                    </div>

                    <button type="button" className="w-full bg-brand-primary text-white py-2.5 rounded-lg font-bold hover:bg-brand-primary/90 transition-colors shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2">
                        <LogIn size={20} />
                        Sign In
                    </button>
                </form>

                <div className="mt-6 text-center text-xs text-slate-400">
                    &copy; 2026 FECVISION. All rights reserved.
                </div>
            </div>
        </div>
    );
};

export default Login;
