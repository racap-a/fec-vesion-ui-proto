import { useState } from 'react';
import { Upload, CheckCircle2, Cog, FileText, ArrowRight } from 'lucide-react';

const steps = [
    { id: 1, name: 'Upload', description: 'Landing FEC files', icon: Upload },
    { id: 2, name: 'Validation', description: 'kpiweb154 check', icon: FileText },
    { id: 3, name: 'Processing', description: 'Generating Cubes', icon: Cog },
    { id: 4, name: 'Ready', description: 'Mapping Available', icon: CheckCircle2 },
];

const Ingestion = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);

    // Simulate the Engine Workflow
    // Simulate the Engine Workflow
    const startEngine = () => {
        setIsProcessing(true);

        // Realism: The manager clicks, and the "Engine" starts working
        setTimeout(() => {
            setCurrentStep(2); // Step: Validation
            // Add a "toast" notification or console log for flair
        }, 1200);

        setTimeout(() => {
            setCurrentStep(3); // Step: Engine Processing (-dim/-fact)
        }, 3500);

        setTimeout(() => {
            setCurrentStep(4); // Step: Complete
            setIsProcessing(false);
        }, 6000);
    };

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">FEC Data Ingestion</h1>
                <p className="text-slate-500">Upload and process accounting entries for MEGACORP.</p>
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

            {/* Main Content Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {currentStep === 1 && (
                    <div className="p-12 text-center">
                        <div className="mx-auto w-16 h-16 bg-blue-50 text-brand-primary rounded-full flex items-center justify-center mb-4">
                            <Upload size={32} />
                        </div>
                        <h3 className="text-lg font-semibold">Drop your FEC files here</h3>
                        <p className="text-slate-500 mb-6 text-sm">Accepted format: FEC Standard (txt/csv)</p>
                        <button
                            onClick={startEngine}
                            disabled={isProcessing}
                            className="bg-brand-primary hover:bg-brand-primary/90 text-white px-8 py-3 rounded-xl font-semibold inline-flex items-center gap-2 transition-all"
                        >
                            {isProcessing ? 'Processing...' : 'Upload & Start Engine'}
                            <ArrowRight size={18} />
                        </button>
                    </div>
                )}

                {currentStep > 1 && currentStep < 4 && (
                    <div className="p-12">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-lg font-semibold">Engine Activity</h3>
                                <p className="text-sm text-slate-500 font-mono">
                                    {currentStep === 2 ? '> Renaming to toBeProcessed_...' : '> Executing -dim sim=N -fact...'}
                                </p>
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
                            <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs text-emerald-400 space-y-1">
                                <p>[INFO] Engine kpiweb154 initialized...</p>
                                <p>[DEBUG] Processing file: FEC_MEGACORP_2023.txt</p>
                                {currentStep >= 3 && <p>[EXEC] Running Cube Generation (expins=id_impstag)...</p>}
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === 4 && (
                    <div className="p-12 text-center animate-in fade-in zoom-in duration-300">
                        <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 size={32} />
                        </div>
                        <h3 className="text-lg font-semibold">Processing Complete</h3>
                        <p className="text-slate-500 mb-6 text-sm">Data has been transformed into SQL cubes. You can now proceed to mapping.</p>
                        <button className="bg-slate-900 text-white px-8 py-3 rounded-xl font-semibold">
                            Go to Mapping (F4)
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Ingestion;
