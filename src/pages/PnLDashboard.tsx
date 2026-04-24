import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Loader2, AlertCircle, BarChart3, FileText } from 'lucide-react';
import { clsx } from 'clsx';

// --- Types ---
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

const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

export default function PnLDashboard() {
    const { user } = useAuth();
    
    // Header State
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    
    // Data State
    const [lines, setLines] = useState<PLLine[]>([]);
    
    // API States
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // Fetch Data
    const fetchData = useCallback(async () => {
        if (!user?.companyId) return;

        setIsLoading(true);
        setFetchError(null);

        try {
            const res = await api.get(`/pl/${user.companyId}?year=${selectedYear}`);
            const data: PLResponse = res.data;
            setLines(data.lines || []);
        } catch (err: any) {
            console.error("Failed to fetch P&L data:", err);
            setFetchError("Impossible de charger le compte de résultat.");
        } finally {
            setIsLoading(false);
        }
    }, [user?.companyId, selectedYear]);

    // Re-fetch when Year changes
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- Format Helpers ---
    const formatAmount = (amount: number | undefined): string => {
        return new Intl.NumberFormat('fr-FR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount ?? 0);
    };

    const amountColor = (amount: number | undefined, isHeader: boolean): string => {
        const val = amount ?? 0;
        if (isHeader) return val < 0 ? 'text-red-600 font-black' : 'text-slate-900 font-black';
        return val < 0 ? 'text-red-500' : val > 0 ? 'text-slate-700' : 'text-slate-400';
    };

    const getRowPresentation = (line: PLLine) => {
        if (line.level5) return { label: line.level5, depth: 4 };
        if (line.level4) return { label: line.level4, depth: 3 };
        if (line.level3) return { label: line.level3, depth: 2 };
        if (line.level2) return { label: line.level2, depth: 1 };
        return { label: line.level1, depth: 0 };
    };

    // Helper to generate year options (2020 to 2031)
    const yearOptions = Array.from({ length: 12 }, (_, i) => 2020 + i);

    return (
        <div className="h-full flex flex-col bg-slate-50">
            {/* Header / Controls */}
            <header className="bg-white border-b border-slate-200 px-8 py-5 shrink-0 z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="bg-brand-primary/10 text-brand-primary p-3 rounded-xl border border-brand-primary/20">
                        <BarChart3 size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Compte de Résultat</h1>
                        <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                            <FileText size={14} /> 
                            Vue analytique mensuelle du P&L.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <select 
                        value={selectedYear} 
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-brand-primary focus:border-brand-primary block p-2.5 font-medium min-w-[100px]"
                    >
                        {yearOptions.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
            </header>

            {/* Notifications */}
            {fetchError && (
                <div className="px-8 mt-6 shrink-0">
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 font-medium shadow-sm">
                        <AlertCircle size={20} className="shrink-0" />
                        {fetchError}
                    </div>
                </div>
            )}

            {/* Grid Area */}
            <div className="flex-1 overflow-hidden p-8 pt-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col">
                    
                    {isLoading ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500">
                            <Loader2 size={40} className="animate-spin mb-4 text-brand-primary" />
                            <p className="font-medium text-slate-800">Chargement des données {selectedYear}...</p>
                        </div>
                    ) : fetchError ? (
                        <div className="flex-1 flex items-center justify-center text-slate-400">
                            Données indisponibles.
                        </div>
                    ) : lines.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-dashed border-slate-300">
                                <BarChart3 size={24} className="text-slate-300" />
                            </div>
                            <p className="font-medium text-slate-600 mb-1">Aucune ligne générée pour {selectedYear}</p>
                            <p className="text-sm">Assurez-vous qu'une hiérarchie temporelle existe ou lancez l'IA.</p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
                            <table className="w-full text-sm text-left whitespace-nowrap border-collapse">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 sticky top-0 z-10 border-b border-slate-200 backdrop-blur-sm">
                                    <tr>
                                        <th scope="col" className="px-6 py-4 font-bold text-slate-800 w-80 sticky left-0 bg-slate-50/95 border-r border-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                            Ligne
                                        </th>
                                        {MONTH_LABELS.map(month => (
                                            <th key={month} scope="col" className="px-4 py-4 w-28 text-right font-bold">{month}</th>
                                        ))}
                                        <th scope="col" className="px-6 py-4 w-32 text-right font-black text-slate-900 border-l border-slate-200">
                                            Total
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lines.map((line, idx) => {
                                        const { label, depth } = getRowPresentation(line);
                                        const isNewGroup = idx === 0 || lines[idx - 1].level1 !== line.level1;
                                        const isLevel1Header = depth === 0;

                                        return (
                                            <React.Fragment key={line.presentationId || idx}>
                                                {/* Group Header Separator Line if not explicitly a level 1 row but the group changes */}
                                                {(isNewGroup && !isLevel1Header) && (
                                                    <tr className="bg-slate-50 border-y border-slate-200">
                                                        <td className="px-6 py-2 sticky left-0 bg-slate-50 border-r border-slate-200 font-extrabold text-slate-900 shadow-[2px_0_5px_rgba(0,0,0,0.02)] text-sm tracking-wide">
                                                            {line.level1}
                                                        </td>
                                                        <td colSpan={13} className="bg-slate-50"></td>
                                                    </tr>
                                                )}

                                                <tr className={clsx(
                                                    "border-b border-slate-100 hover:bg-rose-50/10 transition-colors group",
                                                    isLevel1Header && "bg-slate-50 hover:bg-slate-100/80 border-t border-slate-200"
                                                )}>
                                                    <td className={clsx(
                                                        "py-3 sticky left-0 bg-white group-hover:bg-rose-50/10 border-r border-slate-100 shadow-[2px_0_5px_rgba(0,0,0,0.02)] transition-colors",
                                                        isLevel1Header && "bg-slate-50 group-hover:bg-slate-100/80",
                                                        depth === 0 ? "px-6 font-extrabold text-slate-900 text-sm tracking-wide" :
                                                        depth === 1 ? "pr-6 pl-10 font-bold text-slate-800" :
                                                        depth === 2 ? "pr-6 pl-14 font-medium text-slate-700" :
                                                        depth === 3 ? "pr-6 pl-18 text-slate-600" :
                                                        "pr-6 pl-22 text-slate-500 text-xs" // depth 4 (level5)
                                                    )}>
                                                        {label}
                                                    </td>
                                                    
                                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(monthKey => {
                                                        const amount = line.monthlyAmounts?.[monthKey.toString()];
                                                        return (
                                                            <td
                                                                key={monthKey}
                                                                className={clsx(
                                                                    "px-4 py-3 text-right tabular-nums",
                                                                    amountColor(amount, isLevel1Header)
                                                                )}
                                                            >
                                                                {formatAmount(amount)}
                                                            </td>
                                                        );
                                                    })}

                                                    <td className={clsx(
                                                        "px-6 py-3 text-right tabular-nums border-l border-slate-200/60",
                                                        amountColor(line.total, isLevel1Header)
                                                    )}>
                                                        {formatAmount(line.total)}
                                                    </td>
                                                </tr>
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
