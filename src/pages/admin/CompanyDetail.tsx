import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Building2, Users, FileText, Map, CheckCircle2,
    AlertTriangle, Loader2, Clock, ChevronRight, Lock, Sparkles, Pencil,
    XCircle, Mail, BarChart3
} from 'lucide-react';
import { clsx } from 'clsx';
import api from '../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CompanyDetail {
    company: {
        companyID: number; companyName: string; companyCode: string;
        databaseName: string; isActive: boolean; createdAt: string;
    };
    users: {
        userID: number; fullName: string; username: string; email: string;
        role: string; isActive: boolean; mustChangePassword: boolean; lastLogin: string | null;
    }[];
    recentIngestions: {
        logID: number; originalFileName: string | null; status: string;
        currentStep: string | null; processedRows: number | null;
        createdAt: string; userFullName: string;
    }[];
    mappingStats: {
        total: number; mapped: number; auto: number; ai: number;
        manual: number; lastMappingAt: string | null;
    };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, string> = {
        Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        Processing: 'bg-blue-50 text-blue-700 border-blue-200',
        Failed: 'bg-red-50 text-red-700 border-red-200',
        Uploaded: 'bg-slate-50 text-slate-600 border-slate-200',
    };
    return (
        <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full border', map[status] ?? 'bg-slate-50 text-slate-600 border-slate-200')}>
            {status}
        </span>
    );
};

const fmt = (d: string | null) => d
    ? new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(d))
    : '—';

// ─── Main ─────────────────────────────────────────────────────────────────────

type Tab = 'users' | 'ingestions' | 'pipeline';

export default function CompanyDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [data, setData] = useState<CompanyDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<Tab>('users');

    useEffect(() => {
        if (!id) return;
        api.get<CompanyDetail>(`/companies/${id}/detail`)
            .then(r => setData(r.data))
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return (
        <div className="h-full flex items-center justify-center bg-slate-50">
            <Loader2 size={28} className="animate-spin text-brand-primary" />
        </div>
    );

    if (!data) return (
        <div className="h-full flex items-center justify-center bg-slate-50">
            <p className="text-slate-500">Société introuvable.</p>
        </div>
    );

    const { company, users, recentIngestions, mappingStats } = data;
    const mappingPct = mappingStats.total > 0 ? Math.round((mappingStats.mapped / mappingStats.total) * 100) : 0;

    return (
        <div className="h-full flex flex-col bg-slate-50">

            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-8 py-4 shrink-0">
                <button onClick={() => navigate('/admin/companies')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-3 transition-colors">
                    <ArrowLeft size={15} />
                    Sociétés
                </button>
                <div className="flex items-center gap-4">
                    <div className="bg-brand-primary/10 p-3 rounded-xl">
                        <Building2 size={22} className="text-brand-primary" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-bold text-slate-900">{company.companyName}</h1>
                            <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">{company.companyCode}</span>
                            <span className={clsx('text-xs font-semibold px-2.5 py-1 rounded-full border', company.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200')}>
                                {company.isActive ? 'Actif' : 'Inactif'}
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">DB: {company.databaseName} · Créée le {fmt(company.createdAt)}</p>
                    </div>
                </div>
            </header>

            {/* Stats strip */}
            <div className="bg-white border-b border-slate-100 px-8 py-3 shrink-0 flex gap-8">
                <Stat icon={<Users size={14} />} label="Utilisateurs" value={users.length} />
                <Stat icon={<FileText size={14} />} label="Ingestions" value={recentIngestions.length > 0 ? `${recentIngestions.length} récentes` : 'Aucune'} />
                <Stat icon={<Map size={14} />} label="Mapping" value={mappingStats.total > 0 ? `${mappingStats.mapped}/${mappingStats.total} (${mappingPct}%)` : 'Non démarré'} />
                <Stat icon={<BarChart3 size={14} />} label="Dernière ingestion" value={recentIngestions[0] ? fmt(recentIngestions[0].createdAt) : '—'} />
            </div>

            {/* Tabs */}
            <div className="bg-white border-b border-slate-200 px-8 shrink-0">
                <div className="flex gap-6">
                    {([['users', 'Utilisateurs', users.length], ['ingestions', 'Ingestions', recentIngestions.length], ['pipeline', 'Pipeline']] as const).map(([key, label, count]) => (
                        <button
                            key={key}
                            onClick={() => setTab(key)}
                            className={clsx(
                                'flex items-center gap-2 py-3 text-sm font-semibold border-b-2 transition-colors',
                                tab === key ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500 hover:text-slate-800'
                            )}
                        >
                            {label}
                            {count !== undefined && <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{count}</span>}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="max-w-4xl mx-auto">

                    {/* ── Users tab ── */}
                    {tab === 'users' && (
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                            {users.length === 0 ? (
                                <div className="p-8 text-center text-slate-400">Aucun utilisateur pour cette société.</div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            {['Utilisateur', 'Rôle', 'Statut', 'Dernière connexion'].map(h => (
                                                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((u, i) => (
                                            <tr key={u.userID} className={clsx('border-b border-slate-100 last:border-0', i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40')}>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold text-sm shrink-0">
                                                            {u.fullName[0]}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-slate-800">{u.fullName}</p>
                                                            <p className="text-xs text-slate-400">{u.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{u.role}</span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex flex-col gap-1">
                                                        <span className={clsx('inline-flex items-center gap-1 text-xs font-medium', u.isActive ? 'text-emerald-600' : 'text-red-500')}>
                                                            {u.isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                                            {u.isActive ? 'Actif' : 'Inactif'}
                                                        </span>
                                                        {u.mustChangePassword && (
                                                            <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                                                                <Mail size={11} /> En attente
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 text-xs text-slate-500">{fmt(u.lastLogin)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {/* ── Ingestions tab ── */}
                    {tab === 'ingestions' && (
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                            {recentIngestions.length === 0 ? (
                                <div className="p-8 text-center text-slate-400">Aucune ingestion pour cette société.</div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            {['Fichier', 'Statut', 'Lignes', 'Par', 'Date'].map(h => (
                                                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentIngestions.map((ing, i) => (
                                            <tr key={ing.logID} className={clsx('border-b border-slate-100 last:border-0', i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40')}>
                                                <td className="px-5 py-3.5">
                                                    <p className="font-mono text-xs text-slate-700 truncate max-w-[200px]">{ing.originalFileName ?? '—'}</p>
                                                    <p className="text-xs text-slate-400 mt-0.5">{ing.currentStep}</p>
                                                </td>
                                                <td className="px-5 py-3.5"><StatusBadge status={ing.status} /></td>
                                                <td className="px-5 py-3.5 text-xs font-mono text-slate-600">{ing.processedRows?.toLocaleString('fr-FR') ?? '—'}</td>
                                                <td className="px-5 py-3.5 text-xs text-slate-500">{ing.userFullName}</td>
                                                <td className="px-5 py-3.5 text-xs text-slate-500">{fmt(ing.createdAt)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {/* ── Pipeline tab ── */}
                    {tab === 'pipeline' && (
                        <div className="space-y-4">
                            {/* Mapping card */}
                            <div className="bg-white rounded-xl border border-slate-200 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2"><Map size={16} /> Mapping PCG</h3>
                                    <button onClick={() => navigate('/mapping')} className="text-xs text-brand-primary font-semibold hover:underline flex items-center gap-1">
                                        Ouvrir <ChevronRight size={13} />
                                    </button>
                                </div>
                                {mappingStats.total === 0 ? (
                                    <p className="text-sm text-slate-400 italic">Aucun mapping effectué.</p>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="flex-1 bg-slate-100 rounded-full h-2">
                                                <div className="bg-brand-primary h-2 rounded-full transition-all" style={{ width: `${mappingPct}%` }} />
                                            </div>
                                            <span className="text-sm font-bold text-slate-700 shrink-0">{mappingStats.mapped}/{mappingStats.total}</span>
                                        </div>
                                        <div className="flex gap-4 text-xs text-slate-500">
                                            <span className="flex items-center gap-1"><Lock size={11} /> {mappingStats.auto} auto</span>
                                            <span className="flex items-center gap-1"><Sparkles size={11} className="text-purple-400" /> {mappingStats.ai} IA</span>
                                            <span className="flex items-center gap-1"><Pencil size={11} className="text-blue-400" /> {mappingStats.manual} manuel</span>
                                        </div>
                                        {mappingStats.lastMappingAt && (
                                            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1"><Clock size={11} /> Dernier mapping : {fmt(mappingStats.lastMappingAt)}</p>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* P&L card */}
                            <div className="bg-white rounded-xl border border-slate-200 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2"><BarChart3 size={16} /> Compte de Résultat (P&L)</h3>
                                    <button onClick={() => navigate('/ai-pnl-validation')} className="text-xs text-brand-primary font-semibold hover:underline flex items-center gap-1">
                                        Ouvrir <ChevronRight size={13} />
                                    </button>
                                </div>
                                <p className="text-sm text-slate-500">Accédez à la page de validation IA pour générer ou consulter la hiérarchie P&L.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Small stat display
function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
    return (
        <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">{icon}</span>
            <span className="text-slate-400">{label}:</span>
            <span className="font-semibold text-slate-700">{value}</span>
        </div>
    );
}
