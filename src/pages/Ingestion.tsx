import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { IngestionService, type IngestionLog } from '../services/ingestion';
import { UploadZone } from '../components/ingestion/UploadZone';
import { OrchestrationStepper } from '../components/ingestion/OrchestrationStepper';
import { LogTerminal } from '../components/ingestion/LogTerminal';
import { HistoryTable } from '../components/ingestion/HistoryTable';
import { AlertCircle, Play, RefreshCw, ArrowRight, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';

const Ingestion = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // State
    const [activeLog, setActiveLog] = useState<IngestionLog | null>(null);
    const [historyLogs, setHistoryLogs] = useState<IngestionLog[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string>('');
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // Refs for polling
    const pollInterval = useRef<ReturnType<typeof setInterval> | null>(null);

    // Initial Load
    useEffect(() => {
        if (user?.companyId) {
            fetchHistory();
        }
        return () => stopPolling();
    }, [user?.companyId]);

    // Cleanup polling on unmount
    useEffect(() => {
        return () => stopPolling();
    }, []);

    // --- Actions ---

    const fetchHistory = async () => {
        if (!user?.companyId) return;
        setIsLoadingHistory(true);
        try {
            const logs = await IngestionService.getHistory(user.companyId);
            setHistoryLogs(Array.isArray(logs) ? logs : []);
        } catch (err) {
            console.error('Failed to load history', err);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const handleFileSelected = async (file: File) => {
        if (!user?.companyId) {
            setError('No Company Context');
            return;
        }

        setIsProcessing(true);
        setError('');

        try {
            // 1. Upload File
            const response = await IngestionService.uploadFile(user.companyId, file);

            // 2. Create local partial log state immediately from response
            const newLog: IngestionLog = {
                logID: response.logId,
                companyID: user.companyId,
                userID: user.id || 0,
                fileName: response.fileName,
                originalFileName: response.originalFileName,
                status: 'Uploaded',
                currentStep: 'File Uploaded to Landing Zone',
                engineOutput: '',
                processedRows: null,
                errorMessage: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            setActiveLog(newLog);
            setHistoryLogs(prev => [newLog, ...(Array.isArray(prev) ? prev : [])]);

        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Upload Failed');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleStartProcessing = async () => {
        if (!activeLog) return;

        setIsProcessing(true);
        setError('');

        try {
            // 1. Trigger Engine
            await IngestionService.triggerEngine(activeLog.logID);

            // 2. Start Polling
            startPolling(activeLog.logID);

        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to start engine');
            setIsProcessing(false);
        }
    };

    const startPolling = (logId: number) => {
        stopPolling(); // Ensure no duplicate intervals

        pollInterval.current = setInterval(async () => {
            try {
                const updatedLog = await IngestionService.getStatus(logId);
                setActiveLog(updatedLog);

                // Update history list with new status
                setHistoryLogs(prev => prev.map(l => l.logID === logId ? updatedLog : l));

                // Stop polling if done
                if (updatedLog.status === 'Completed' || updatedLog.status === 'Failed') {
                    stopPolling();
                    setIsProcessing(false);
                }
            } catch (err) {
                console.error('Polling error', err);
                stopPolling();
                setIsProcessing(false);
            }
        }, 2000); // Poll every 2 seconds
    };

    const stopPolling = () => {
        if (pollInterval.current) {
            clearInterval(pollInterval.current);
            pollInterval.current = null;
        }
    };

    const handleSelectLog = (log: IngestionLog) => {
        setActiveLog(log);
        stopPolling();

        // If selected log is in progress, resume polling
        if (log.status === 'Processing') {
            startPolling(log.logID);
            setIsProcessing(true);
        } else {
            setIsProcessing(false);
        }
    };

    const clearActiveLog = () => {
        setActiveLog(null);
        stopPolling();
        setIsProcessing(false);
        setError('');
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <header className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">FEC Data Ingestion</h1>
                    <p className="text-slate-500 mt-1">Upload and process accounting entries for <span className="font-semibold text-slate-700">{user?.companyName}</span>.</p>
                </div>
                {activeLog && (
                    <button
                        onClick={clearActiveLog}
                        className="text-sm text-slate-500 hover:text-slate-800 underline"
                    >
                        Start New Upload
                    </button>
                )}
            </header>

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Panel: Active Workflow */}
                <div className="lg:col-span-2 space-y-6">

                    {/* 1. Upload Zone */}
                    {!activeLog || activeLog.status === 'Uploaded' ? (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-bold text-slate-800">1. Upload File</h2>
                                {activeLog && <span className="text-xs font-mono bg-slate-100 text-slate-500 px-2 py-1 rounded">Log ID: {activeLog.logID}</span>}
                            </div>

                            <UploadZone
                                onFileSelected={handleFileSelected}
                                isProcessing={isProcessing}
                                selectedFile={activeLog ? ({ name: activeLog.originalFileName, size: 0 } as File) : null} // Mock file object for display
                                clearFile={clearActiveLog}
                            />

                            {/* Action to Proceed */}
                            {activeLog && activeLog.status === 'Uploaded' && (
                                <div className="mt-6 flex justify-end">
                                    <button
                                        onClick={handleStartProcessing}
                                        disabled={isProcessing}
                                        className="bg-brand-primary hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-brand-primary/20 transition-all"
                                    >
                                        {isProcessing ? <RefreshCw className="animate-spin" /> : <Play size={20} />}
                                        Start Engine Processing
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : null}

                    {/* 2. Orchestration & Logs (Visible when Active Log exists) */}
                    {activeLog && (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4">
                            <div className="mb-6 flex items-center justify-between">
                                <h2 className="text-lg font-bold text-slate-800">2. Orchestration Pipeline</h2>
                                <span className={clsx(
                                    "px-3 py-1 rounded-full text-xs font-bold uppercase",
                                    activeLog.status === 'Processing' ? "bg-blue-100 text-blue-700 animate-pulse" :
                                        activeLog.status === 'Completed' ? "bg-emerald-100 text-emerald-700" :
                                            activeLog.status === 'Failed' ? "bg-red-100 text-red-700 border border-red-200" :
                                                "bg-slate-100 text-slate-500"
                                )}>
                                    {activeLog.status === 'Failed' ? 'Process Failed' : activeLog.status}
                                </span>
                            </div>

                            {activeLog.status !== 'Completed' && (
                                <>
                                    <OrchestrationStepper log={activeLog} />
                                    <div className="mt-8">
                                        <LogTerminal log={activeLog} />
                                    </div>
                                </>
                            )}

                            {activeLog.status === 'Completed' && (
                                <div className="text-center py-12 animate-in fade-in zoom-in duration-500">
                                    <div className="mx-auto w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
                                        <CheckCircle2 size={48} className="animate-in zoom-in spin-in-12 duration-700" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Ingestion Successful!</h2>
                                    <p className="text-slate-500 mb-8">
                                        Successfully processed <span className="font-mono font-bold text-slate-900">{activeLog.processedRows?.toLocaleString() || 0}</span> rows.
                                        <br />
                                        Data has been transformed and is ready for analysis.
                                    </p>

                                    <button
                                        onClick={() => navigate('/mapping')}
                                        className="bg-brand-primary hover:bg-brand-primary/90 text-white px-8 py-4 rounded-xl font-bold inline-flex items-center gap-3 shadow-lg shadow-brand-primary/20 transition-all hover:scale-105"
                                    >
                                        Analyze & Map Accounts (F4) <ArrowRight size={20} />
                                    </button>
                                </div>
                            )}

                            {activeLog.status === 'Failed' && (
                                <div className="mt-6 flex justify-end gap-4">
                                    <button
                                        onClick={clearActiveLog}
                                        className="text-slate-500 hover:text-slate-700 px-6 py-3 font-semibold"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleStartProcessing}
                                        disabled={isProcessing}
                                        className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-red-600/20 transition-all"
                                    >
                                        {isProcessing ? <RefreshCw className="animate-spin" /> : <RefreshCw size={20} />}
                                        Re-run Process
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Panel: History */}
                <div className="lg:col-span-1">
                    <HistoryTable
                        logs={historyLogs}
                        onSelectLog={handleSelectLog}
                        isLoading={isLoadingHistory}
                        onRefresh={fetchHistory}
                    />
                </div>
            </div>
        </div>
    );
};

export default Ingestion;
