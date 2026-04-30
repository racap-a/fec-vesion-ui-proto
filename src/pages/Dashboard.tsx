import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Building2, UploadCloud, Map, BarChart3,
    Calculator, ArrowRight, PlusCircle, ChevronRight,
    Users, CheckCircle2, Clock, AlertCircle, TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { FinancialIngestionDashboard } from '../components/dashboard/FinancialIngestionDashboard';
import api from '../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CompanyWithStats {
    companyID: number;
    companyName: string;
    companyCode: string;
    isActive: boolean;
    createdAt: string;
    userCount?: number;
    mappedAccounts?: number;
    lastIngestionAt?: string | null;
    lastIngestionStatus?: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PIPELINE = [
    { step: 1, icon: UploadCloud, name: 'Ingestion FEC',      desc: 'Upload & traitement',        href: '/ingestion',  iconClass: 'bg-emerald-100 text-emerald-600' },
    { step: 2, icon: Map,         name: 'Mapping PCG',         desc: 'Association des comptes',    href: '/mapping',    iconClass: 'bg-blue-100 text-blue-600' },
    { step: 3, icon: BarChart3,   name: 'Compte de Résultat',  desc: 'Vue analytique',             href: '/pl-dashboard', iconClass: 'bg-indigo-100 text-indigo-600' },
];

const USER_FEATURES = [
    { icon: UploadCloud, name: 'Ingestion FEC',        desc: 'Importez et traitez vos fichiers FEC.',              href: '/ingestion',    iconClass: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    { icon: Map,         name: 'Mapping PCG',           desc: 'Associez vos comptes au plan comptable général.',    href: '/mapping',      iconClass: 'bg-blue-50 text-blue-600 border-blue-100' },
    { icon: Calculator,  name: 'Saisie Extra-Comptable',desc: 'Ajoutez vos budgets et retraitements manuels.',     href: '/saisie-extra', iconClass: 'bg-amber-50 text-amber-600 border-amber-100' },
    { icon: BarChart3,   name: 'Compte de Résultat',    desc: "Analysez votre P&L mensuel en un coup d'œil.",      href: '/pl-dashboard', iconClass: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
];

const ADMIN_FEATURES = [
    { icon: Building2,  name: 'Gestion des sociétés', desc: 'Voir toutes les sociétés et leur pipeline.',              href: '/admin/companies',       iconClass: 'bg-brand-dark/5 text-brand-dark border-brand-dark/10' },
    { icon: PlusCircle, name: 'Créer une société',    desc: 'Provisionner un nouvel environnement client.',           href: '/admin/create-company',  iconClass: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    { icon: Users,      name: 'Utilisateurs',          desc: 'Gérer les accès et statuts des utilisateurs.',          href: '/admin/users',           iconClass: 'bg-blue-50 text-blue-600 border-blue-100' },
];

// ─── Shared greeting header ───────────────────────────────────────────────────

const DashboardHeader = ({ firstName, subtitle }: { firstName: string; subtitle: string }) => {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
    const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
        <header className="bg-white border-b border-slate-200 px-8 py-5 shrink-0">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {greeting},{' '}
                <span className="text-brand-primary">{firstName}</span>
            </h1>
            <p className="text-sm text-slate-500 mt-0.5 capitalize">
                {subtitle}{' · '}{today}
            </p>
        </header>
    );
};

// ─── Shared quick-access card ─────────────────────────────────────────────────

const FeatureCard = ({ icon: Icon, name, desc, href, iconClass }: {
    icon: React.ElementType; name: string; desc: string; href: string; iconClass: string;
}) => (
    <Link
        to={href}
        className="group bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md hover:-translate-y-0.5 transition-all flex gap-4 items-start"
    >
        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${iconClass}`}>
            <Icon size={18} />
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand-primary transition-colors">{name}</h3>
                <ChevronRight size={15} className="text-slate-300 group-hover:text-brand-primary shrink-0 transition-colors" />
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{desc}</p>
        </div>
    </Link>
);

// ─── Admin dashboard ──────────────────────────────────────────────────────────

const AdminDashboard = ({ firstName }: { firstName: string }) => {
    const [companies, setCompanies] = useState<CompanyWithStats[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/companies/with-stats')
            .then(r => setCompanies(r.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const totalUsers = companies.reduce((s, c) => s + (c.userCount ?? 0), 0);
    const activeCompanies = companies.filter(c => c.isActive).length;
    const recentCompanies = [...companies]
        .sort((a, b) => {
            const da = a.lastIngestionAt ? new Date(a.lastIngestionAt).getTime() : 0;
            const db = b.lastIngestionAt ? new Date(b.lastIngestionAt).getTime() : 0;
            return db - da;
        })
        .slice(0, 5);

    const statusIcon = (status: string | null | undefined) => {
        if (!status) return <span className="text-slate-400 text-xs">—</span>;
        if (status === 'Completed') return <span className="flex items-center gap-1 text-xs font-medium text-emerald-600"><CheckCircle2 size={13} /> Succès</span>;
        if (status === 'Processing' || status === 'Uploaded') return <span className="flex items-center gap-1 text-xs font-medium text-blue-500"><Clock size={13} /> En cours</span>;
        if (status === 'Failed') return <span className="flex items-center gap-1 text-xs font-medium text-red-500"><AlertCircle size={13} /> Erreur</span>;
        return <span className="text-slate-400 text-xs">{status}</span>;
    };

    return (
        <div className="h-full flex flex-col bg-slate-50">
            <DashboardHeader firstName={firstName} subtitle="Global Admin" />

            <div className="flex-1 overflow-y-auto">
                <div className="max-w-6xl mx-auto p-8 space-y-8">

                    {/* KPI strip */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { label: 'Sociétés actives', value: loading ? '—' : String(activeCompanies), icon: Building2,   color: 'bg-brand-dark/5 text-brand-dark' },
                            { label: 'Utilisateurs',     value: loading ? '—' : String(totalUsers),       icon: Users,        color: 'bg-blue-50 text-blue-600' },
                            { label: 'Total sociétés',   value: loading ? '—' : String(companies.length), icon: TrendingUp,   color: 'bg-emerald-50 text-emerald-600' },
                        ].map(stat => (
                            <div key={stat.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-5 flex items-center gap-4">
                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${stat.color}`}>
                                    <stat.icon size={20} />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                                    <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Recent activity */}
                    {!loading && recentCompanies.length > 0 && (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    Activité récente
                                </p>
                                <Link to="/admin/companies" className="text-xs font-semibold text-brand-primary hover:text-slate-700 flex items-center gap-1 transition-colors">
                                    Voir tout <ArrowRight size={13} />
                                </Link>
                            </div>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="px-6 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Société</th>
                                        <th className="px-6 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Utilisateurs</th>
                                        <th className="px-6 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Dernière ingestion</th>
                                        <th className="px-6 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Statut</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {recentCompanies.map(c => (
                                        <tr key={c.companyID} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="px-6 py-3">
                                                <Link to={`/admin/companies/${c.companyID}`} className="font-semibold text-slate-800 hover:text-brand-primary transition-colors">
                                                    {c.companyName}
                                                </Link>
                                                <div className="text-[11px] text-slate-400">{c.companyCode}</div>
                                            </td>
                                            <td className="px-6 py-3 text-slate-600">{c.userCount ?? 0}</td>
                                            <td className="px-6 py-3 text-slate-500 text-xs">
                                                {c.lastIngestionAt
                                                    ? new Date(c.lastIngestionAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
                                                    : <span className="text-slate-300">—</span>
                                                }
                                            </td>
                                            <td className="px-6 py-3">{statusIcon(c.lastIngestionStatus)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Quick access */}
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Accès rapide</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {ADMIN_FEATURES.map(f => <FeatureCard key={f.href} {...f} />)}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

// ─── User dashboard ───────────────────────────────────────────────────────────

const UserDashboard = ({ firstName, companyName }: { firstName: string; companyName: string }) => (
    <div className="h-full flex flex-col bg-slate-50">
        <DashboardHeader firstName={firstName} subtitle={companyName} />

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
                                <Link to={s.href} className="flex-1 group flex flex-col items-center gap-2.5 text-center">
                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${s.iconClass}`}>
                                        <s.icon size={19} />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-700 group-hover:text-brand-primary transition-colors">{s.name}</div>
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
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Accès rapide</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {USER_FEATURES.map(f => <FeatureCard key={f.href} {...f} />)}
                    </div>
                </div>

            </div>
        </div>
    </div>
);

// ─── Root ─────────────────────────────────────────────────────────────────────

const Dashboard = () => {
    const { user } = useAuth();
    const firstName = user?.fullName?.split(' ')[0] || user?.username || '';

    if (user?.role === 'Admin') {
        return <AdminDashboard firstName={firstName} />;
    }

    return <UserDashboard firstName={firstName} companyName={user?.companyName || ''} />;
};

export default Dashboard;
