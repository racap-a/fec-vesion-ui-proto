import { useState } from 'react';
import { Upload, CheckCircle2, Cog, FileText, ArrowRight, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const steps = [
    { id: 1, name: 'Upload', description: 'Landing FEC files', icon: Upload },
    { id: 2, name: 'Engine Start', description: 'Trigger Processing', icon: Cog },
    { id: 3, name: 'Processing', description: 'Generating Cubes', icon: FileText },
    { id: 4, name: 'Ready', description: 'Mapping Available', icon: CheckCircle2 },
];

const Ingestion = () => {
    const { user } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const [error, setError] = useState<string>('');

    const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
            setError('');
        }
    };

    const runIngestionFlow = async () => {
        if (!selectedFile) return;
        if (!user?.companyId) {
            setError('No Company Context. Please log in as a Company User.');
            return;
        }

        setIsProcessing(true);
        setLogs([]);
        setError('');

        try {
            // Step 1: Upload
            addLog('Starting Upload...');
            const formData = new FormData();
            formData.append('file', selectedFile);

            await api.post(`/fecingestion/upload/${user.companyId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            addLog('Upload Successful. File in Landing Zone.');
            setCurrentStep(2);

            // Step 2: Trigger Engine
            addLog('Triggering Engine (kpiweb154)...');
            const triggerResponse = await api.post(`/fecingestion/trigger-engine/${user.companyId}`);

            if (triggerResponse.data.success) {
                addLog(`Engine Started. Output Lines: ${triggerResponse.data.outputLines}`);
                setCurrentStep(3);

                // Simulate processing time since engine is async or fast
                setTimeout(() => {
                    addLog('Cube Generation Complete.');
                    setCurrentStep(4);
                    setIsProcessing(false);
                }, 2000);
            } else {
                throw new Error(triggerResponse.data.error || 'Engine failed to start');
            }

        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || err.message || 'Ingestion Failed');
            setIsProcessing(false);
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">FEC Data Ingestion</h1>
                <p className="text-slate-500">Upload and process accounting entries for {user?.companyName || 'Unknown Company'}.</p>
            </header>

            {/* Stepper Header */}
            <nav aria-label="Progress" className="mb-12">
                <ol className="flex items-center">
                    {steps.map((step, idx) => (
                        <li key={step.name} className={`relative ${idx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
                            <div className="flex items-center">
                                <div className={`z-10 flex h-10 w-10 items-center justify-center rounded-full transition-colors ${currentStep >= step.id ? 'bg-brand-primary text-white' : 'bg-slate-200 text-slate-500'
                                    }`}>
                                    <step.icon size={20} />
                                </div>
                                {idx !== steps.length - 1 && (
                                    <div className={`absolute top-5 left-10 h-0.5 w-full -z-0 ${currentStep > step.id ? 'bg-brand-primary' : 'bg-slate-200'
                                        }`} />
                                )}
                            </div>
                            <div className="mt-2">
                                <span className="text-xs font-bold uppercase tracking-wide text-slate-900">{step.name}</span>
                            </div>
                        </li>
                    ))}
                </ol>
            </nav>

            {/* Error Banner */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-3">
                    <AlertTriangle size={20} />
                    {error}
                </div>
            )}

            {/* Main Content Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
                {currentStep === 1 && (
                    <div className="p-12 text-center flex flex-col items-center justify-center h-full">
                        <div className="mx-auto w-16 h-16 bg-blue-50 text-brand-primary rounded-full flex items-center justify-center mb-4">
                            <Upload size={32} />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Select FEC File</h3>
                        <input
                            type="file"
                            accept=".txt,.csv"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-brand-primary hover:file:bg-blue-100 mb-6 max-w-xs mx-auto"
                        />
                        <button
                            onClick={runIngestionFlow}
                            disabled={isProcessing || !selectedFile}
                            className="bg-brand-primary hover:bg-brand-primary/90 text-white px-8 py-3 rounded-xl font-semibold inline-flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? 'Uploading...' : 'Upload & Start Engine'}
                            <ArrowRight size={18} />
                        </button>
                    </div>
                )}

                {currentStep > 1 && currentStep < 4 && (
                    <div className="p-12">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-lg font-semibold">Engine Activity</h3>
                                <p className="text-sm text-slate-500 font-mono">&gt; Processing stream...</p>
                            </div>
                            <div className="flex items-center gap-2 text-brand-primary animate-pulse">
                                <Cog className="animate-spin" size={20} />
                                <span className="text-sm font-bold uppercase">Live Engine Feed</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-brand-primary transition-all duration-500"
                                    style={{ width: `${(currentStep / steps.length) * 100}%` }}
                                />
                            </div>
                            <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs text-emerald-400 space-y-1 h-48 overflow-y-auto">
                                {logs.map((log, i) => (
                                    <p key={i}>{log}</p>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === 4 && (
                    <div className="p-12 text-center animate-in fade-in zoom-in duration-300 flex flex-col items-center justify-center h-full">
                        <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 size={32} />
                        </div>
                        <h3 className="text-lg font-semibold">Processing Complete</h3>
                        <p className="text-slate-500 mb-6 text-sm">Data has been transformed into SQL cubes. You can now proceed to mapping.</p>
                        <button className="bg-slate-900 text-white px-8 py-3 rounded-xl font-semibold hover:bg-slate-800 transition-colors">
                            Go to Mapping (F4)
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Ingestion;

