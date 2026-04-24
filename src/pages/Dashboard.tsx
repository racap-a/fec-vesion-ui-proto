import React from 'react';
import { Link } from 'react-router-dom';
import {
    Building2, UploadCloud, Map, BarChart3, Sparkles,
    Calculator, ArrowRight, PlusCircle, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { FinancialIngestionDashboard } from '../components/dashboard/FinancialIngestionDashboard';

// --- Pipeline steps ---
const PIPELINE = [
    {
        step: 1,
        icon: UploadCloud,
        name: 'Ingestion FEC',
        desc: 'Upload & traitement',
        href: '/ingestion',
        iconClass: 'bg-emerald-100 text-emerald-600',
    },
    {
        step: 2,
        icon: Map,
        name: 'Mapping PCG',
        desc: 'Association des comptes',
        href: '/mapping',
        iconClass: 'bg-blue-100 text-blue-600',
    },
    {
        step: 3,
        icon: Sparkles,
        name: 'Validation IA',
        desc: 'Hiérarchie P&L',
        href: '/ai-pnl-validation',
        iconClass: 'bg-violet-100 text-violet-600',
    },
    {
        step: 4,
        icon: BarChart3,
        name: 'Compte de Résultat',
        desc: 'Vue analytique',
        href: '/pl-dashboard',
        iconClass: 'bg-indigo-100 text-indigo-600',
    },
];

// --- Quick-access feature cards ---
interface FeatureCard {
    icon: React.ElementType;
    name: string;
    desc: string;
    href: string;
    iconClass: string;
    adminOnly?: boolean;
}

const FEATURES: FeatureCard[] = [
    {
        icon: UploadCloud,
        name: 'Ingestion FEC',
        desc: 'Importez et traitez vos fichiers FEC.',
        href: '/ingestion',
        iconClass: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
        icon: Map,
        name: 'Mapping PCG',
        desc: 'Associez vos comptes au plan comptable général.',
        href: '/mapping',
        iconClass: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
        icon: Calculator,
        name: 'Saisie Extra-Comptable',
        desc: 'Ajoutez vos budgets et retraitements manuels.',
        href: '/saisie-extra',
        iconClass: 'bg-amber-50 text-amber-600 border-amber-100',
    },
    {
        icon: Sparkles,
        name: 'Validation IA P&L',
        desc: "Validez et ajustez la hiérarchie générée par l'IA.",
        href: '/ai-pnl-validation',
        iconClass: 'bg-violet-50 text-violet-600 border-violet-100',
    },
    {
        icon: BarChart3,
        name: 'Compte de Résultat',
        desc: "Analysez votre P&L mensuel en un coup d'œil.",
        href: '/pl-dashboard',
        iconClass: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    },
    {
        icon: Building2,
        name: 'Gestion des sociétés',
        desc: 'Administrez les environnements et accès clients.',
        href: '/admin/companies',
        iconClass: 'bg-slate-50 text-slate-600 border-slate-200',
        adminOnly: true,
    },
    {
        icon: PlusCircle,
        name: 'Créer une société',
        desc: 'Provisionnez un nouvel environnement client.',
        href: '/admin/create-company',
        iconClass: 'bg-slate-50 text-slate-600 border-slate-200',
        adminOnly: true,
    },
];

const Dashboard = () => {
    const { user } = useAuth();

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
    const firstName = user?.fullName?.split(' ')[0] || user?.username || '';
    const today = new Date().toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long'
    });

    const visibleFeatures = FEATURES.filter(f => !f.adminOnly || user?.role === 'Admin');

    return (
        <div className="h-full flex flex-col bg-slate-50">

            {/* ── Sticky header ── */}
            <header className="bg-white border-b border-slate-200 px-8 py-5 shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                            {greeting},{' '}
                            <span className="text-brand-primary">{firstName}</span>
                        </h1>
                        <p className="text-sm text-slate-500 mt-0.5 capitalize">
                            {user?.role === 'Admin' ? 'Global Admin' : user?.companyName}
                            {' · '}{today}
                        </p>
                    </div>
                </div>
            </header>

            {/* ── Scrollable content ── */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-6xl mx-auto p-8 space-y-8">

                    {/* Pipeline strip */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-8 py-6">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">
                            Pipeline d'analyse FEC
                        </p>
                        <div className="flex items-start">
                            {PIPELINE.map((s, i) => (
                                <React.Fragment key={s.href}>
                                    <Link
                                        to={s.href}
                                        className="flex-1 group flex flex-col items-center gap-2.5 text-center"
                                    >
                                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${s.iconClass}`}>
                                            <s.icon size={19} />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-slate-700 group-hover:text-brand-primary transition-colors">
                                                {s.name}
                                            </div>
                                            <div className="text-[11px] text-slate-400 mt-0.5">{s.desc}</div>
                                        </div>
                                    </Link>
                                    {i < PIPELINE.length - 1 && (
                                        <div className="flex items-center mt-4 px-1 shrink-0">
                                            <ArrowRight size={14} className="text-slate-300" />
                                        </div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    {/* KPI widget */}
                    <FinancialIngestionDashboard />

                    {/* Quick access */}
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                            Accès rapide
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {visibleFeatures.map(f => (
                                <Link
                                    key={f.href}
                                    to={f.href}
                                    className="group bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md hover:-translate-y-0.5 transition-all flex gap-4 items-start"
                                >
                                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${f.iconClass}`}>
                                        <f.icon size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand-primary transition-colors">
                                                {f.name}
                                            </h3>
                                            <ChevronRight size={15} className="text-slate-300 group-hover:text-brand-primary shrink-0 transition-colors" />
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{f.desc}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Dashboard;
