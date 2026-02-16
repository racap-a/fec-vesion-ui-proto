import React, { useEffect, useRef } from 'react';
import { Terminal, AlertCircle } from 'lucide-react';
// import { clsx } from 'clsx';
import type { IngestionLog } from '../../services/ingestion';

interface LogTerminalProps {
    log: IngestionLog | null;
}

export const LogTerminal: React.FC<LogTerminalProps> = ({ log }) => {
    const bottomRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when output updates
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [log?.engineOutput]);

    if (!log) return null;

    return (
        <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
            <div className="bg-slate-950 px-4 py-2 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2 text-slate-400">
                    <Terminal size={14} />
                    <span className="text-xs font-mono font-bold uppercase">kpiweb154.exe Output</span>
                </div>
                <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                </div>
            </div>

            <div className="p-4 h-64 overflow-y-auto font-mono text-xs space-y-1 relative">
                {!log.engineOutput && !log.errorMessage ? (
                    <div className="flex items-center justify-center h-full text-slate-600 italic">
                        Waiting for engine stream...
                    </div>
                ) : (
                    <>
                        {/* Contextual Help / Diagnostics */}
                        {(log.engineOutput?.includes('KPIW-1690') && log.engineOutput?.includes('Input string was not in a correct format')) && (
                            <div className="mb-4 p-3 bg-amber-900/30 border border-amber-500/50 rounded text-amber-200">
                                <div className="flex items-center gap-2 mb-1 font-bold text-amber-400">
                                    <AlertCircle size={14} /> Engine Diagnostic: Format Error
                                </div>
                                <p className="text-sm opacity-90">
                                    Engine configuration format error. Please check for illegal characters or missing spaces in the instruction setup.
                                </p>
                            </div>
                        )}

                        {/* Standard Output */}
                        {log.engineOutput?.split('\n').map((line, i) => (
                            <div key={i} className="text-emerald-400 break-words border-l-2 border-transparent hover:border-slate-700 hover:bg-white/5 pl-2 py-0.5 font-mono text-xs">
                                <span className="text-slate-600 mr-2 select-none">$</span>
                                {line}
                            </div>
                        ))}

                        {/* Error Output */}
                        {log.errorMessage && (
                            <div className="mt-4 p-3 bg-red-900/20 border border-red-900/50 rounded text-red-400 break-words animate-pulse">
                                <div className="flex items-center gap-2 mb-1 font-bold">
                                    <AlertCircle size={14} /> Process Error
                                </div>
                                {log.errorMessage}
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </>
                )}
            </div>
        </div>
    );
};
