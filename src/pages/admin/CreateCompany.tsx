import { useState } from 'react';
import { Building2, Database, User, Mail, FolderPlus, Loader2, CheckCircle2, Server, HardDrive, ShieldCheck, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

const CreateCompany = () => {
    const navigate = useNavigate();
    // const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        companyName: '',
        companyCode: '', // Uppercase letters/numbers
        adminEmail: '', // Initial Admin Username
        adminName: '',  // Initial Admin Full Name
    });

    // Orchestration Simulation State
    const [processingStep, setProcessingStep] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);

    const steps = [
        { title: 'Portal_V3 Registration', desc: 'Creating company record & IAM assignment', icon: ShieldCheck },
        { title: 'KPIWFIN1 Staging', desc: 'Initializing _FEC staging tables', icon: Database },
        { title: 'KPIW_1.5 Source Config', desc: 'Registering source in legacy engine', icon: Server },
        { title: 'File System Provisioning', desc: 'Creating Input/Processed/Rejected directories', icon: HardDrive },
    ];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        if (name === 'companyCode') {
            // Force uppercase and alphanumeric for code
            const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
            setFormData(prev => ({ ...prev, [name]: cleaned }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const simulateOrchestration = async () => {
        setIsProcessing(true);
        setError('');

        try {
            // Step 1: Portal_V3
            setProcessingStep(0);
            await new Promise(r => setTimeout(r, 800));

            // Step 2: KPIWFIN1
            setProcessingStep(1);
            await new Promise(r => setTimeout(r, 800));

            // Step 3: KPIW_1.5
            setProcessingStep(2);
            await new Promise(r => setTimeout(r, 800));

            // Step 4: File System
            setProcessingStep(3);
            await new Promise(r => setTimeout(r, 800));

            // Finalize: Call Actual API
            // Note: In a real scenario, this single call might trigger the whole flow in the backend,
            // or we might chain calls. For now, we simulate the visual feedback then submit.
            await api.post('/companies', {
                companyName: formData.companyName,
                companyCode: formData.companyCode,
                adminEmail: formData.adminEmail,
                adminFullName: formData.adminName,
                // Defaulting other required fields for now or letting backend handle defaults
                databaseName: `KPIW_${formData.companyCode}`
            });

            // Success Transition
            setProcessingStep(4); // Done
            await new Promise(r => setTimeout(r, 500));
            navigate('/admin/companies');

        } catch (err: any) {
            console.error('Provisioning failed', err);
            setError(err.response?.data?.message || 'Orchestration failed in Tier 2 (KPIWFIN1). Please contact support.');
            setIsProcessing(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.companyCode || !formData.companyName || !formData.adminEmail || !formData.adminName) {
            setError('All fields are required.');
            return;
        }
        await simulateOrchestration();
    };

    // Render Processing UI
    if (isProcessing) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 bg-slate-50">
                <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-3">
                        <Loader2 className="animate-spin text-brand-primary" />
                        Provisioning Environment
                    </h2>
                    <p className="text-slate-500 mb-8">Orchestrating 3-Tier Architecture setup for {formData.companyName}...</p>

                    <div className="space-y-6">
                        {steps.map((step, index) => {
                            const isCompleted = processingStep > index;
                            const isCurrent = processingStep === index;

                            return (
                                <div key={index} className={`flex items-start gap-4 transition-all duration-500 ${isCurrent || isCompleted ? 'opacity-100' : 'opacity-40'}`}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 
                                        ${isCompleted ? 'bg-emerald-100 border-emerald-500 text-emerald-600' :
                                            isCurrent ? 'bg-blue-100 border-blue-500 text-blue-600 animate-pulse' :
                                                'bg-slate-100 border-slate-200 text-slate-400'}`}>
                                        {isCompleted ? <CheckCircle2 size={20} /> : <step.icon size={20} />}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className={`font-bold ${isCurrent ? 'text-brand-primary' : 'text-slate-900'}`}>{step.title}</h3>
                                        <p className="text-sm text-slate-500">{step.desc}</p>
                                    </div>
                                    {isCurrent && <Loader2 size={16} className="animate-spin text-brand-primary mt-1" />}
                                    {isCompleted && <CheckCircle2 size={16} className="text-emerald-500 mt-1" />}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-8">
            <header>
                <h1 className="text-2xl font-bold text-slate-900">Create New Company</h1>
                <p className="text-slate-500">Register new client environments and configure 3-tier architecture.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Registration Form */}
                <div className="lg:col-span-2 bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                        <Building2 size={20} className="text-brand-primary" />
                        Entity Details
                    </h2>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2 border border-red-100">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Company Name *</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="companyName"
                                        placeholder="e.g. Acme Industries"
                                        value={formData.companyName}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-slate-900 bg-white"
                                        required
                                    />
                                    <Building2 className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Company Code *</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="companyCode"
                                        placeholder="e.g. ACME01"
                                        value={formData.companyCode}
                                        onChange={handleChange}
                                        maxLength={10}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all font-mono uppercase text-slate-900 bg-white"
                                        required
                                    />
                                    <Database className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                </div>
                                <p className="text-xs text-slate-400 mt-1">Used for folder generation & DB IDs</p>
                            </div>
                        </div>

                        <div className="border-t border-slate-100 my-6"></div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Initial Admin Full Name *</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="adminName"
                                        placeholder="John Doe"
                                        value={formData.adminName}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-slate-900 bg-white"
                                        required
                                    />
                                    <User className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Initial Admin Email *</label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        name="adminEmail"
                                        placeholder="admin@company.com"
                                        value={formData.adminEmail}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-slate-900 bg-white"
                                        required
                                    />
                                    <Mail className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                </div>
                                <p className="text-xs text-slate-400 mt-1">Will be used as the initial username</p>
                            </div>
                        </div>

                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={isProcessing}
                                className="w-full bg-brand-dark text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20"
                            >
                                <FolderPlus size={20} />
                                Start Orchestration
                            </button>
                        </div>
                    </form>
                </div>

                {/* Architecture Preview Panel */}
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 h-fit">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Orchestration Preview</h3>

                    <div className="space-y-6 relative">
                        {/* Connecting Line */}
                        <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-200"></div>

                        <div className="relative flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center z-10 shrink-0 text-slate-500">
                                <span className="font-bold text-xs">1</span>
                            </div>
                            <div>
                                <p className="font-bold text-slate-900 text-sm">Tier 1: Portal_V3</p>
                                <p className="text-xs text-slate-500 mt-1">Creates tenant record and links IAM policy.</p>
                            </div>
                        </div>

                        <div className="relative flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center z-10 shrink-0 text-slate-500">
                                <span className="font-bold text-xs">2</span>
                            </div>
                            <div>
                                <p className="font-bold text-slate-900 text-sm">Tier 2: KPIWFIN1</p>
                                <p className="text-xs text-slate-500 mt-1">Deploys standard <span className="font-mono bg-slate-200 px-1 rounded">_FEC</span> staging schema.</p>
                            </div>
                        </div>

                        <div className="relative flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center z-10 shrink-0 text-slate-500">
                                <span className="font-bold text-xs">3</span>
                            </div>
                            <div>
                                <p className="font-bold text-slate-900 text-sm">Tier 3: KPIW_1.5</p>
                                <p className="text-xs text-slate-500 mt-1">Injects source definition into legacy engine config.</p>
                            </div>
                        </div>

                        <div className="relative flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center z-10 shrink-0 text-slate-500">
                                <span className="font-bold text-xs">4</span>
                            </div>
                            <div>
                                <p className="font-bold text-slate-900 text-sm">File System</p>
                                <div className="mt-2 text-[10px] font-mono bg-slate-800 text-slate-300 p-2.5 rounded border border-slate-700">
                                    /Data/Clients/{formData.companyCode || 'XXXX'}/<br />
                                    ├── Input/<br />
                                    ├── Processed/<br />
                                    └── Rejected/
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateCompany;
