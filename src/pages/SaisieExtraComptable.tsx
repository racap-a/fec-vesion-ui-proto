import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Plus, Save, Trash2, Loader2, AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';

// --- Types ---
type EntryType = 'BUDGET' | 'ADJUSTMENT';

interface ApiEntry {
    id: string;
    accountCode: string;
    accountLabel: string;
    year: number;
    month: number;
    amount: number;
    type: EntryType;
    description?: string;
    createdAt: string;
}

interface SaveEntryDto {
    accountCode: string;
    year: number;
    month: number;
    amount: number;
    type: EntryType;
    description?: string;
}

interface GridRow {
    uuid: string;
    accountCode: string;
    accountLabel: string;
    months: (number | null)[]; // Array of 12 numbers. index 0 = Jan, 11 = Dec
}

const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

export default function SaisieExtraComptable() {
    const { user } = useAuth(); // Key specific audit point: Getting companyId from exact same source as Mapping.tsx
    
    // Header State
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [selectedType, setSelectedType] = useState<EntryType>('BUDGET');
    
    // Grid State
    const [rows, setRows] = useState<GridRow[]>([]);
    
    // API States
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    
    // Result States
    const [saveSuccess, setSaveSuccess] = useState<{ count: number } | null>(null);
    const [unresolvedAccounts, setUnresolvedAccounts] = useState<string[]>([]);
    const [invalidPeriods, setInvalidPeriods] = useState<string[]>([]);
    const [saveError, setSaveError] = useState<string | null>(null);

    // Fetch Initial Data
    const fetchData = useCallback(async () => {
        if (!user?.companyId) return;

        setIsLoading(true);
        setFetchError(null);
        setSaveSuccess(null);
        setUnresolvedAccounts([]);
        setInvalidPeriods([]);

        try {
            const res = await api.get(`/extra-entries/${user.companyId}?year=${selectedYear}`);
            const entries: ApiEntry[] = res.data.entries || [];

            // Group flat entries by accountCode to build matrix rows
            const grouped = new Map<string, GridRow>();
            
            entries.forEach(entry => {
                // If we switched type, just show the entries for that type or let backend filter?
                // Spec implies API might return all types, so filtering by type visually or just displaying them all.
                // Assuming we want to show all entries for the year but save operations use selectedType.
                
                if (!grouped.has(entry.accountCode)) {
                    grouped.set(entry.accountCode, {
                        uuid: crypto.randomUUID(),
                        accountCode: entry.accountCode,
                        accountLabel: entry.accountLabel || '',
                        months: Array(12).fill(null)
                    });
                }
                
                // entry.month is assumed 1-12
                if (entry.month >= 1 && entry.month <= 12) {
                    grouped.get(entry.accountCode)!.months[entry.month - 1] = entry.amount;
                }
            });

            setRows(Array.from(grouped.values()));
        } catch (err: any) {
            console.error("Failed to fetch extra entries:", err);
            setFetchError("Impossible de charger les saisies extra-comptables.");
        } finally {
            setIsLoading(false);
        }
    }, [user?.companyId, selectedYear]);

    // Re-fetch when Year changes
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- Handlers ---
    
    const handleAddRow = () => {
        setRows(prev => [
            ...prev,
            {
                uuid: crypto.randomUUID(),
                accountCode: '',
                accountLabel: '',
                months: Array(12).fill(null)
            }
        ]);
    };

    const handleDeleteRow = (uuid: string) => {
        setRows(prev => prev.filter(r => r.uuid !== uuid));
    };

    const handleAccountCodeChange = (uuid: string, newCode: string) => {
        setRows(prev => prev.map(r => 
            r.uuid === uuid ? { ...r, accountCode: newCode } : r
        ));
    };

    const handleMonthValueChange = (uuid: string, monthIndex: number, valueStr: string) => {
        const parsed = valueStr === '' ? null : parseFloat(valueStr);
        setRows(prev => prev.map(r => {
            if (r.uuid === uuid) {
                const newMonths = [...r.months];
                newMonths[monthIndex] = parsed !== null && !isNaN(parsed) ? parsed : null;
                return { ...r, months: newMonths };
            }
            return r;
        }));
    };

    const handleSave = async () => {
        if (!user?.companyId) return;

        setIsSaving(true);
        setSaveError(null);
        setSaveSuccess(null);
        setUnresolvedAccounts([]);
        setInvalidPeriods([]);

        // Flatten matrix into DTO array
        const payloadEntries: SaveEntryDto[] = [];

        rows.forEach(row => {
            if (!row.accountCode.trim()) return; // Skip rows without account codes

            row.months.forEach((amount, index) => {
                if (amount !== null) {
                    payloadEntries.push({
                        accountCode: row.accountCode.trim(),
                        year: selectedYear,
                        month: index + 1, // 1 to 12
                        amount,
                        type: selectedType
                    });
                }
            });
        });

        if (payloadEntries.length === 0) {
            setSaveError("Aucune donnée valide à enregistrer.");
            setIsSaving(false);
            return;
        }

        try {
            const res = await api.post(`/extra-entries/${user.companyId}`, {
                entries: payloadEntries
            });

            if (res.data.success || res.status === 200 || res.status === 201) {
                setSaveSuccess({ count: res.data.savedCount || payloadEntries.length });
                if (res.data.unresolvedAccounts) setUnresolvedAccounts(res.data.unresolvedAccounts);
                if (res.data.invalidPeriods) setInvalidPeriods(res.data.invalidPeriods);
                
                // Refresh grid to get updated read-only account labels
                fetchData();
            }
        } catch (err: any) {
            console.error("Save entries error:", err);
            setSaveError(err.response?.data?.message || err.message || "Erreur lors de l'enregistrement des données.");
        } finally {
            setIsSaving(false);
        }
    };

    // --- Render Helpers ---
    
    // Generate year options (2020 to 2031)
    const yearOptions = Array.from({ length: 12 }, (_, i) => 2020 + i);

    return (
        <div className="h-full flex flex-col bg-slate-50">
            {/* Header / Controls */}
            <header className="bg-white border-b border-slate-200 px-8 py-5 shrink-0 z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Saisie Extra-Comptable</h1>
                        <p className="text-sm text-slate-500 mt-1">Ajoutez ou modifiez des données budgétaires ou des retraitements.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <select 
                            value={selectedYear} 
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-brand-primary focus:border-brand-primary block p-2.5 font-medium min-w-[100px]"
                        >
                            {yearOptions.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>

                        <select 
                            value={selectedType} 
                            onChange={(e) => setSelectedType(e.target.value as EntryType)}
                            className="bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-brand-primary focus:border-brand-primary block p-2.5 font-medium min-w-[140px]"
                        >
                            <option value="BUDGET">BUDGET</option>
                            <option value="ADJUSTMENT">ADJUSTMENT</option>
                        </select>

                        <div className="w-px h-8 bg-slate-200 mx-2 hidden md:block"></div>

                        <button 
                            onClick={handleAddRow}
                            className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all"
                        >
                            <Plus size={16} />
                            Ajouter un compte
                        </button>
                        
                        <button 
                            onClick={handleSave}
                            disabled={isSaving || isLoading}
                            className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-slate-800 transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                        >
                            {isSaving ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Save size={16} className="text-emerald-400" />
                            )}
                            Enregistrer
                        </button>
                    </div>
                </div>
            </header>

            {/* Notifications */}
            <div className="px-8 mt-6 shrink-0 empty:hidden">
                {fetchError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 font-medium shadow-sm mb-4">
                        <AlertCircle size={20} className="shrink-0" />
                        {fetchError}
                    </div>
                )}
                {saveError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 font-medium shadow-sm mb-4">
                        <AlertCircle size={20} className="shrink-0" />
                        {saveError}
                    </div>
                )}
                {saveSuccess && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col gap-2 shadow-sm mb-4">
                        <div className="flex items-center gap-3 text-emerald-800 font-medium">
                            <CheckCircle2 size={20} className="shrink-0 text-emerald-500" />
                            {saveSuccess.count} entrées enregistrées avec succès.
                        </div>
                        {unresolvedAccounts.length > 0 && (
                            <div className="flex items-start gap-2 text-amber-700 bg-amber-50 p-2 rounded border border-amber-200 mt-2 text-sm mt-1">
                                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-bold">Attention — Comptes non trouvés dans le PCG cible:</span>
                                    <div className="font-mono mt-1 text-xs bg-white/50 p-1.5 rounded border border-amber-100/50">
                                        {unresolvedAccounts.join(', ')}
                                    </div>
                                </div>
                            </div>
                        )}
                        {invalidPeriods.length > 0 && (
                            <div className="flex items-start gap-2 text-amber-700 bg-amber-50 p-2 rounded border border-amber-200 text-sm mt-1">
                                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-bold">Périodes invalides (rejetées):</span>
                                    <div className="font-mono mt-1 text-xs">
                                        {invalidPeriods.join(', ')}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Grid Area */}
            <div className="flex-1 overflow-hidden p-8 pt-4">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col">
                    
                    {isLoading ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500">
                            <Loader2 size={40} className="animate-spin mb-4 text-brand-primary" />
                            <p className="font-medium text-slate-800">Chargement des données {selectedYear}...</p>
                        </div>
                    ) : rows.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-dashed border-slate-300">
                                <Plus size={24} className="text-slate-300" />
                            </div>
                            <p className="font-medium text-slate-600 mb-1">Aucune donnée pour {selectedYear}</p>
                            <p className="text-sm">Cliquez sur « Ajouter un compte » pour commencer.</p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
                            <table className="w-full text-sm text-left whitespace-nowrap">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 sticky top-0 z-10 border-b border-slate-200 backdrop-blur-sm">
                                    <tr>
                                        <th scope="col" className="px-4 py-3 font-bold text-slate-800 w-48 sticky left-0 bg-slate-50/95 border-r border-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">Compte</th>
                                        <th scope="col" className="px-4 py-3 font-bold w-64 min-w-[200px]">Libellé</th>
                                        {MONTH_LABELS.map(month => (
                                            <th key={month} scope="col" className="px-3 py-3 w-28 text-right font-bold">{month}</th>
                                        ))}
                                        <th scope="col" className="px-4 py-3 w-16 text-center"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row) => (
                                        <tr key={row.uuid} className="border-b border-slate-100 hover:bg-slate-50/50 group transition-colors">
                                            <td className="px-4 py-2 sticky left-0 bg-white group-hover:bg-slate-50 border-r border-slate-100 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                                <input 
                                                    type="text"
                                                    value={row.accountCode}
                                                    onChange={(e) => handleAccountCodeChange(row.uuid, e.target.value)}
                                                    placeholder="Ex: 701000"
                                                    className="w-full px-2 py-1.5 bg-transparent border border-transparent hover:border-slate-200 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary rounded font-mono text-sm transition-all"
                                                />
                                            </td>
                                            <td className="px-4 py-2 truncate max-w-[250px] text-xs text-slate-500">
                                                {row.accountLabel || <span className="italic text-slate-300">Nouveau compte...</span>}
                                            </td>
                                            {row.months.map((val, idx) => (
                                                <td key={idx} className="px-2 py-2">
                                                    <input 
                                                        type="number"
                                                        value={val === null ? '' : val}
                                                        onChange={(e) => handleMonthValueChange(row.uuid, idx, e.target.value)}
                                                        className="w-full px-2 py-1.5 text-right bg-transparent border border-transparent hover:border-slate-200 focus:bg-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary rounded text-sm transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                        placeholder="—"
                                                    />
                                                </td>
                                            ))}
                                            <td className="px-4 py-2 text-center">
                                                <button 
                                                    onClick={() => handleDeleteRow(row.uuid)}
                                                    className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                    title="Supprimer la ligne"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
