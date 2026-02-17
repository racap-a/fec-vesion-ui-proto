import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FinancialService, type FinancialSummary } from '../../services/financial';
import { CheckCircle2, AlertTriangle, TrendingUp, ArrowRight, Scale, Calculator } from 'lucide-react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';

export const FinancialIngestionDashboard = () => {
    const { user } = useAuth();
    const [summary, setSummary] = useState<FinancialSummary | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSummary = async () => {
        if (!user?.companyCode) return;

        setIsLoading(true);
        setError(null);

        try {
            const data = await FinancialService.getSummary(user.companyCode);
            setSummary(data);
        } catch (err: any) {
            console.error('Failed to load financial summary', err);
            // Handle specific 404 for "No Tables" vs generic 500
            if (err.response?.status === 404) {
                setSummary(null); // Treat as empty state/not found
            } else {
                setError('Failed to load financial data. Service might be unavailable.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSummary();
    }, [user?.companyCode]);

    if (!user?.companyCode) return null;

    // Loading State
    if (isLoading && !summary) {
        return (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm animate-pulse">
                <div className="h-8 bg-slate-100 rounded w-1/3 mb-6"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="h-24 bg-slate-50 rounded-xl"></div>
                    <div className="h-24 bg-slate-50 rounded-xl"></div>
                    <div className="h-24 bg-slate-50 rounded-xl"></div>
                </div>
            </div>
        );
    }

    // Error State
    if (error) {
        return (
            <div className="bg-red-50 rounded-2xl p-8 border border-red-100 flex items-start gap-4 text-red-700">
                <AlertTriangle className="shrink-0 mt-1" />
                <div>
                    <h3 className="font-bold text-lg mb-1">Connection Error</h3>
                    <p className="text-sm opacity-80">{error}</p>
                    <button
                        onClick={fetchSummary}
                        className="mt-4 px-4 py-2 bg-white border border-red-200 rounded-lg text-sm font-semibold hover:bg-red-50 transition-colors"
                    >
                        Retry Connection
                    </button>
                </div>
            </div>
        );
    }

    // Empty State (No Data / 404)
    if (!summary) {
        return (
            <div className="bg-white rounded-2xl p-10 border border-slate-200 shadow-sm text-center">
                <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calculator size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Waiting for First Ingestion</h3>
                <p className="text-slate-500 max-w-md mx-auto mb-8">
                    No financial data found for {user.companyName}. Upload your first FEC file to initialize the ledger.
                </p>
                <Link
                    to="/ingestion"
                    className="inline-flex items-center gap-2 bg-brand-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-primary/90 transition-colors shadow-lg shadow-brand-primary/20"
                >
                    Upload FEC <ArrowRight size={20} />
                </Link>
            </div>
        );
    }

    // Success State (Golden Path)
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
                <div className="flex items-center gap-3">
                    <div className="bg-emerald-100 text-emerald-600 p-2 rounded-full">
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Ingestion Successful</h2>
                        <p className="text-sm text-slate-500">
                            Last updated: {new Date(summary.lastIngestionDate).toLocaleString()}
                        </p>
                    </div>
                </div>

                <div className={clsx(
                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border",
                    summary.isBalanced
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-red-50 text-red-700 border-red-200"
                )}>
                    <Scale size={16} />
                    {summary.isBalanced ? "Ledger Balanced" : "Balance Mismatch Detected"}
                </div>
            </div>

            {/* Financial Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                {/* Total Rows */}
                <div className="p-8 group hover:bg-slate-50/50 transition-colors">
                    <div className="text-slate-500 text-sm font-medium mb-2 uppercase tracking-wider flex items-center gap-2">
                        <Calculator size={16} /> Total Rows
                    </div>
                    <div className="text-3xl font-bold text-slate-900 font-mono">
                        {summary.totalRows.toLocaleString()}
                    </div>
                </div>

                {/* Total Debit */}
                <div className="p-8 group hover:bg-slate-50/50 transition-colors">
                    <div className="text-slate-500 text-sm font-medium mb-2 uppercase tracking-wider flex items-center gap-2">
                        <TrendingUp size={16} className="text-blue-500" /> Total Debit
                    </div>
                    <div className="text-3xl font-bold text-slate-900 font-mono">
                        {summary.totalDebit.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </div>
                </div>

                {/* Total Credit */}
                <div className="p-8 group hover:bg-slate-50/50 transition-colors">
                    <div className="text-slate-500 text-sm font-medium mb-2 uppercase tracking-wider flex items-center gap-2">
                        <TrendingUp size={16} className="text-purple-500" /> Total Credit
                    </div>
                    <div className="text-3xl font-bold text-slate-900 font-mono">
                        {summary.totalCredit.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </div>
                </div>
            </div>

            {/* Action Footer */}
            {summary.totalRows > 0 && (
                <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <Link
                        to="/mapping"
                        className="text-sm font-semibold text-brand-primary hover:text-slate-800 flex items-center gap-2 transition-colors"
                    >
                        View Account Mapping <ArrowRight size={16} />
                    </Link>
                </div>
            )}
        </div>
    );
};
