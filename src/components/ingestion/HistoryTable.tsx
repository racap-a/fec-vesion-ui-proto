import React from 'react';
import type { IngestionLog } from '../../services/ingestion';
import { FileText, CheckCircle2, AlertTriangle, Clock, RotateCw } from 'lucide-react';
import { clsx } from 'clsx';

interface HistoryTableProps {
    logs: IngestionLog[];
    onSelectLog: (log: IngestionLog) => void;
    isLoading: boolean;
    onRefresh: () => void;
}

export const HistoryTable: React.FC<HistoryTableProps> = ({ logs, onSelectLog, isLoading, onRefresh }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Clock size={16} className="text-slate-400" />
                    Ingestion History
                </h3>
                <button
                    onClick={onRefresh}
                    disabled={isLoading}
                    className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors disabled:opacity-50"
                    title="Refresh Log History"
                >
                    <RotateCw size={16} className={clsx(isLoading && "animate-spin")} />
                </button>
            </div>

            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-3">File Name</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Processed Rows</th>
                        <th className="px-6 py-3 text-right">Date</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {!Array.isArray(logs) || logs.length === 0 ? (
                        <tr>
                            <td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic">
                                No ingestion history found.
                            </td>
                        </tr>
                    ) : (
                        logs.map((log) => (
                            <tr
                                key={log.logID}
                                onClick={() => onSelectLog(log)}
                                className="hover:bg-slate-50 transition-colors cursor-pointer group"
                            >
                                <td className="px-6 py-3.5 font-medium text-slate-900 group-hover:text-brand-primary flex items-center gap-3">
                                    <FileText size={16} className="text-slate-400" />
                                    {log.originalFileName || log.fileName}
                                </td>
                                <td className="px-6 py-3.5">
                                    <span className={clsx(
                                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
                                        log.status === 'Completed' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                            log.status === 'Processing' ? "bg-blue-50 text-blue-700 border-blue-100" :
                                                log.status === 'Failed' ? "bg-red-50 text-red-700 border-red-100" :
                                                    "bg-slate-100 text-slate-600 border-slate-200"
                                    )}>
                                        {log.status === 'Completed' && <CheckCircle2 size={12} />}
                                        {log.status === 'Failed' && <AlertTriangle size={12} />}
                                        {log.status}
                                    </span>
                                </td>
                                <td className="px-6 py-3.5 text-slate-600 font-mono">
                                    {log.processedRows ? log.processedRows.toLocaleString() : '-'}
                                </td>
                                <td className="px-6 py-3.5 text-right text-slate-500 text-xs">
                                    {new Date(log.createdAt).toLocaleString()}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};
