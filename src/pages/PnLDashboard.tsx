import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Loader2, AlertCircle, BarChart3, FileText, TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PLLine {
    presentationId: number;
    level1: string;
    level2: string | null;
    level3: string | null;
    level4: string | null;
    level5: string | null;
    ordre: number;
    monthlyAmounts: Record<string, number>;
    total: number;
}

export interface PLResponse {
    year: number;
    lines: PLLine[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
const PALETTE = ['#153151', '#F4C867', '#10b981', '#6366f1', '#f97316', '#06b6d4', '#ec4899'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getDepth = (line: PLLine) => {
    if (line.level5) return 4;
    if (line.level4) return 3;
    if (line.level3) return 2;
    if (line.level2) return 1;
    return 0;
};

const getLabel = (line: PLLine) =>
    line.level5 ?? line.level4 ?? line.level3 ?? line.level2 ?? line.level1;

const formatAmount = (v: number | undefined) =>
    new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v ?? 0);

const compactAmount = (v: number) => {
    const abs = Math.abs(v);
    if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M€`;
    if (abs >= 1_000) return `${(v / 1_000).toFixed(0)}k€`;
    return `${v.toFixed(0)}€`;
};

const amountColor = (v: number | undefined, bold: boolean) => {
    const val = v ?? 0;
    if (bold) return val < 0 ? 'text-red-600 font-black' : 'text-slate-900 font-black';
    return val < 0 ? 'text-red-500' : val > 0 ? 'text-slate-700' : 'text-slate-400';
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

const BarTooltipContent = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs min-w-[180px]">
            <p className="font-bold text-slate-700 mb-2">{label}</p>
            {payload.map((p: any) => (
                <div key={p.dataKey} className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: p.fill }} />
                    <span className="text-slate-500 truncate flex-1">{p.dataKey}</span>
                    <span className="font-semibold text-slate-800 tabular-nums ml-2">
                        {compactAmount(p.value)}
                    </span>
                </div>
            ))}
        </div>
    );
};

const DonutTooltipContent = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const { name, value, rawValue } = payload[0].payload;
    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs">
            <p className="font-bold text-slate-700 mb-1 max-w-[200px] whitespace-normal">{name}</p>
            <p className={clsx('font-semibold tabular-nums', rawValue < 0 ? 'text-red-500' : 'text-emerald-600')}>
                {formatAmount(rawValue)} €
            </p>
        </div>
    );
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function PnLDashboard() {
    const { user } = useAuth();
    const [selectedYear, setSelectedYear] = useState<number>(0);
    const [availableYears, setAvailableYears] = useState<number[]>([]);
    const [lines, setLines] = useState<PLLine[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const [pnlGenerating, setPnlGenerating] = useState(false);
    const [pnlFailed, setPnlFailed] = useState(false);
    const [insights, setInsights] = useState<string | null>(null);
    const [insightsLoading, setInsightsLoading] = useState(false);

    // Fetch available years on mount. If none yet, the backend is still generating — poll every 5s.
    // Stops after 90s with no data and surfaces a failure state.
    useEffect(() => {
        if (!user?.companyId) return;
        let intervalId: ReturnType<typeof setInterval> | null = null;
        const startedAt = Date.now();

        const fetchYears = async () => {
            try {
                const res = await api.get(`/pl/${user.companyId}/available-years`);
                const years: number[] = res.data ?? [];
                if (years.length > 0) {
                    if (intervalId) clearInterval(intervalId);
                    setPnlGenerating(false);
                    setPnlFailed(false);
                    setAvailableYears(years);
                    setSelectedYear(years[0]);
                } else if (Date.now() - startedAt > 90_000) {
                    if (intervalId) clearInterval(intervalId);
                    setPnlGenerating(false);
                    setPnlFailed(true);
                    setIsLoading(false);
                } else {
                    setPnlGenerating(true);
                    setIsLoading(false);
                }
            } catch {
                setSelectedYear(new Date().getFullYear());
                setIsLoading(false);
            }
        };

        fetchYears();
        intervalId = setInterval(fetchYears, 5000);
        return () => { if (intervalId) clearInterval(intervalId); };
    }, [user?.companyId]);

    const fetchData = useCallback(async () => {
        if (!user?.companyId || selectedYear === 0) return;
        setIsLoading(true);
        setFetchError(null);
        setInsights(null);
        try {
            const res = await api.get(`/pl/${user.companyId}?year=${selectedYear}`);
            setLines((res.data as PLResponse).lines ?? []);
        } catch {
            setFetchError("Impossible de charger le compte de résultat.");
        } finally {
            setIsLoading(false);
        }
    }, [user?.companyId, selectedYear]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Fetch AI insights after lines are loaded — best-effort, non-blocking
    useEffect(() => {
        if (!user?.companyId || selectedYear === 0 || lines.length === 0) return;
        let cancelled = false;
        setInsightsLoading(true);
        api.get(`/pl/${user.companyId}/insights?year=${selectedYear}`)
            .then(res => { if (!cancelled) setInsights(res.data?.text ?? null); })
            .catch(() => { if (!cancelled) setInsights(null); })
            .finally(() => { if (!cancelled) setInsightsLoading(false); });
        return () => { cancelled = true; };
    }, [user?.companyId, selectedYear, lines.length]);

    // ── Chart data ──────────────────────────────────────────────────────────
    // Backend returns only leaf rows (always Level1+Level2 minimum, never a Level1-only aggregate row).
    // We aggregate by Level1 here to build chart summaries.

    const level1Aggregates = useMemo(() => {
        const map = new Map<string, { level1: string; ordre: number; monthlyAmounts: Record<string, number>; total: number }>();
        lines.forEach(l => {
            const existing = map.get(l.level1);
            if (!existing) {
                const monthly: Record<string, number> = {};
                for (let m = 1; m <= 12; m++) monthly[String(m)] = l.monthlyAmounts?.[String(m)] ?? 0;
                map.set(l.level1, { level1: l.level1, ordre: l.ordre, monthlyAmounts: monthly, total: l.total });
            } else {
                for (let m = 1; m <= 12; m++) {
                    existing.monthlyAmounts[String(m)] += l.monthlyAmounts?.[String(m)] ?? 0;
                }
                existing.total += l.total;
            }
        });
        return Array.from(map.values()).sort((a, b) => a.ordre - b.ordre);
    }, [lines]);

    // Top 5 by absolute total for bar chart
    const topForBar = useMemo(
        () => [...level1Aggregates].sort((a, b) => Math.abs(b.total) - Math.abs(a.total)).slice(0, 5),
        [level1Aggregates]
    );

    const barData = useMemo(() =>
        Array.from({ length: 12 }, (_, i) => {
            const m = (i + 1).toString();
            const entry: Record<string, number | string> = { month: MONTH_LABELS[i] };
            topForBar.forEach(l => { entry[l.level1] = l.monthlyAmounts?.[m] ?? 0; });
            return entry;
        }),
        [topForBar]
    );

    const donutData = useMemo(() =>
        level1Aggregates
            .filter(l => l.total !== 0)
            .map(l => ({ name: l.level1, value: Math.abs(l.total), rawValue: l.total }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6),
        [level1Aggregates]
    );

    const hasCharts = level1Aggregates.length > 0;

    // CA: sum of all lines whose label at any level contains "chiffre d'affaires"
    const caTotal = useMemo(() =>
        lines
            .filter(l => [l.level1, l.level2, l.level3, l.level4, l.level5]
                .some(lv => lv?.toLowerCase().includes("chiffre d'affaire")))
            .reduce((sum, l) => sum + l.total, 0),
        [lines]
    );

    // Résultat Net: algebraic sum of all presentation lines
    const resultatNet = useMemo(() =>
        lines.reduce((sum, l) => sum + l.total, 0),
        [lines]
    );

    // ── Render ──────────────────────────────────────────────────────────────

    return (
        <div className="h-full flex flex-col bg-slate-50">

            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-8 py-5 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="bg-brand-primary/10 text-brand-primary p-3 rounded-xl border border-brand-primary/20">
                        <BarChart3 size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Compte de Résultat</h1>
                        <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                            <FileText size={14} /> Vue analytique mensuelle du P&L
                        </p>
                    </div>
                </div>
                <select
                    value={selectedYear}
                    onChange={e => setSelectedYear(Number(e.target.value))}
                    className="bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-brand-primary focus:border-brand-primary p-2.5 font-medium min-w-[100px]"
                >
                    {(availableYears.length > 0 ? availableYears : [selectedYear]).map(y => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>
            </header>

            {/* Error banner */}
            {fetchError && (
                <div className="px-8 mt-4 shrink-0">
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 font-medium">
                        <AlertCircle size={20} className="shrink-0" />
                        {fetchError}
                    </div>
                </div>
            )}

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-screen-2xl mx-auto p-8 space-y-6">

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-32 text-slate-500">
                            <Loader2 size={40} className="animate-spin mb-4 text-brand-primary" />
                            <p className="font-medium text-slate-800">Chargement {selectedYear}…</p>
                        </div>
                    ) : pnlFailed ? (
                        <div className="flex flex-col items-center justify-center py-32 text-slate-400 gap-3">
                            <AlertCircle size={36} className="text-amber-400" />
                            <p className="font-medium text-slate-700">La génération du P&L a échoué</p>
                            <p className="text-sm text-slate-400 text-center max-w-xs">
                                L'IA n'a pas pu construire la hiérarchie (surcharge temporaire). Retournez au Mapping et cliquez sur <strong>Enregistrer</strong> pour relancer.
                            </p>
                        </div>
                    ) : pnlGenerating ? (
                        <div className="flex flex-col items-center justify-center py-32 text-slate-400">
                            <Loader2 size={36} className="animate-spin mb-4 text-brand-primary" />
                            <p className="font-medium text-slate-700 mb-1">Génération du Compte de Résultat…</p>
                            <p className="text-sm text-slate-400 text-center max-w-xs">
                                L'IA analyse vos comptes et construit la hiérarchie P&L. Cela prend quelques secondes.
                            </p>
                        </div>
                    ) : lines.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 text-slate-400">
                            <Sparkles size={28} className="mb-4 text-slate-300" />
                            <p className="font-medium text-slate-600 mb-1">Aucune donnée pour cette période</p>
                            <p className="text-sm text-slate-400 text-center max-w-xs">
                                Vérifiez que le fichier FEC a bien été ingéré et le mapping sauvegardé.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* ── Hero KPIs: CA + Résultat Net ── */}
                            {hasCharts && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Chiffre d'Affaires</p>
                                            <TrendingUp size={15} className="text-emerald-500 shrink-0" />
                                        </div>
                                        <p className={clsx('text-3xl font-black tabular-nums leading-none', caTotal < 0 ? 'text-red-600' : 'text-slate-900')}>
                                            {compactAmount(caTotal)}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-2 tabular-nums">{formatAmount(caTotal)} €</p>
                                    </div>
                                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Résultat Net</p>
                                            {resultatNet < 0
                                                ? <TrendingDown size={15} className="text-red-500 shrink-0" />
                                                : <TrendingUp size={15} className="text-emerald-500 shrink-0" />}
                                        </div>
                                        <p className={clsx('text-3xl font-black tabular-nums leading-none', resultatNet < 0 ? 'text-red-600' : 'text-emerald-600')}>
                                            {compactAmount(resultatNet)}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-2 tabular-nums">{formatAmount(resultatNet)} €</p>
                                    </div>
                                </div>
                            )}

                            {/* ── AI Insights ── */}
                            {(insightsLoading || insights) && (
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Sparkles size={14} className="text-purple-400 shrink-0" />
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Analyse IA</p>
                                    </div>
                                    {insightsLoading ? (
                                        <div className="space-y-2">
                                            <div className="h-3 bg-slate-100 rounded animate-pulse w-full" />
                                            <div className="h-3 bg-slate-100 rounded animate-pulse w-5/6" />
                                            <div className="h-3 bg-slate-100 rounded animate-pulse w-4/6" />
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-600 leading-relaxed italic">{insights}</p>
                                    )}
                                </div>
                            )}

                            {/* ── KPI Cards ── */}
                            {hasCharts && (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                                    {level1Aggregates.slice(0, 6).map((l, i) => {
                                        const isNeg = l.total < 0;
                                        const isZero = l.total === 0;
                                        return (
                                            <div
                                                key={l.presentationId}
                                                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-2"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div
                                                        className="w-3 h-3 rounded-full shrink-0"
                                                        style={{ background: PALETTE[i % PALETTE.length] }}
                                                    />
                                                    {isZero ? (
                                                        <Minus size={14} className="text-slate-400" />
                                                    ) : isNeg ? (
                                                        <TrendingDown size={14} className="text-red-500" />
                                                    ) : (
                                                        <TrendingUp size={14} className="text-emerald-500" />
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-slate-500 leading-tight line-clamp-2 min-h-[28px]">
                                                    {l.level1}
                                                </p>
                                                <p className={clsx(
                                                    'text-lg font-bold tabular-nums leading-none',
                                                    isNeg ? 'text-red-600' : 'text-slate-900'
                                                )}>
                                                    {compactAmount(l.total)}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* ── Charts row ── */}
                            {hasCharts && (
                                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                                    {/* Bar chart — monthly evolution */}
                                    <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                                            Évolution mensuelle
                                        </p>
                                        <ResponsiveContainer width="100%" height={240}>
                                            <BarChart data={barData} barGap={2} barCategoryGap="25%">
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                                <XAxis
                                                    dataKey="month"
                                                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                />
                                                <YAxis
                                                    tickFormatter={compactAmount}
                                                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    width={60}
                                                />
                                                <Tooltip content={<BarTooltipContent />} cursor={{ fill: '#f8fafc' }} />
                                                <Legend
                                                    iconType="circle"
                                                    iconSize={8}
                                                    wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }}
                                                    formatter={(v) => <span style={{ color: '#64748b' }}>{v}</span>}
                                                />
                                                {topForBar.map((l, i) => (
                                                    <Bar
                                                        key={l.level1}
                                                        dataKey={l.level1}
                                                        stackId="a"
                                                        fill={PALETTE[i % PALETTE.length]}
                                                        radius={i === topForBar.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                                                    />
                                                ))}
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Donut — breakdown */}
                                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                                            Répartition annuelle
                                        </p>
                                        <div className="flex-1 flex flex-col items-center justify-center">
                                            <ResponsiveContainer width="100%" height={180}>
                                                <PieChart>
                                                    <Pie
                                                        data={donutData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={55}
                                                        outerRadius={80}
                                                        paddingAngle={3}
                                                        dataKey="value"
                                                        strokeWidth={0}
                                                    >
                                                        {donutData.map((_, i) => (
                                                            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip content={<DonutTooltipContent />} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                            {/* Legend */}
                                            <div className="w-full space-y-1.5 mt-2">
                                                {donutData.map((d, i) => (
                                                    <div key={d.name} className="flex items-center gap-2 text-xs">
                                                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: PALETTE[i % PALETTE.length] }} />
                                                        <span className="text-slate-500 truncate flex-1">{d.name}</span>
                                                        <span className={clsx('font-semibold tabular-nums shrink-0', d.rawValue < 0 ? 'text-red-500' : 'text-slate-700')}>
                                                            {compactAmount(d.rawValue)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            )}

                            {/* ── Table ── */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        Détail mensuel
                                    </p>
                                </div>
                                <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
                                    <table className="w-full text-sm text-left whitespace-nowrap border-collapse">
                                        <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 sticky top-0 z-10 border-b border-slate-200 backdrop-blur-sm">
                                            <tr>
                                                <th className="px-6 py-4 font-bold text-slate-800 w-80 sticky left-0 bg-slate-50/95 border-r border-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                                    Ligne
                                                </th>
                                                {MONTH_LABELS.map(m => (
                                                    <th key={m} className="px-4 py-4 w-28 text-right font-bold">{m}</th>
                                                ))}
                                                <th className="px-6 py-4 w-32 text-right font-black text-slate-900 border-l border-slate-200">
                                                    Total
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {lines.map((line, idx) => {
                                                const depth = getDepth(line);
                                                const label = getLabel(line);
                                                const isNewGroup = idx === 0 || lines[idx - 1].level1 !== line.level1;
                                                const isLevel1 = depth === 0;

                                                return (
                                                    <React.Fragment key={line.presentationId || idx}>
                                                        {isNewGroup && !isLevel1 && (
                                                            <tr className="bg-slate-50 border-y border-slate-200">
                                                                <td className="px-6 py-2 sticky left-0 bg-slate-50 border-r border-slate-200 font-extrabold text-slate-900 shadow-[2px_0_5px_rgba(0,0,0,0.02)] text-sm tracking-wide">
                                                                    {line.level1}
                                                                </td>
                                                                <td colSpan={13} className="bg-slate-50" />
                                                            </tr>
                                                        )}
                                                        <tr className={clsx(
                                                            "border-b border-slate-100 hover:bg-slate-50/60 transition-colors group",
                                                            isLevel1 && "bg-slate-50 hover:bg-slate-100/80 border-t border-slate-200"
                                                        )}>
                                                            <td className={clsx(
                                                                "py-3 sticky left-0 border-r border-slate-100 shadow-[2px_0_5px_rgba(0,0,0,0.02)] transition-colors group-hover:bg-slate-50/60",
                                                                isLevel1 ? "bg-slate-50 px-6 font-extrabold text-slate-900 text-sm tracking-wide" :
                                                                depth === 1 ? "bg-white pr-6 pl-10 font-bold text-slate-800" :
                                                                depth === 2 ? "bg-white pr-6 pl-14 font-medium text-slate-700" :
                                                                depth === 3 ? "bg-white pr-6 pl-18 text-slate-600" :
                                                                "bg-white pr-6 pl-22 text-slate-500 text-xs"
                                                            )}>
                                                                {label}
                                                            </td>
                                                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                                                <td key={m} className={clsx("px-4 py-3 text-right tabular-nums", amountColor(line.monthlyAmounts?.[m.toString()], isLevel1))}>
                                                                    {formatAmount(line.monthlyAmounts?.[m.toString()])}
                                                                </td>
                                                            ))}
                                                            <td className={clsx("px-6 py-3 text-right tabular-nums border-l border-slate-200/60", amountColor(line.total, isLevel1))}>
                                                                {formatAmount(line.total)}
                                                            </td>
                                                        </tr>
                                                    </React.Fragment>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
