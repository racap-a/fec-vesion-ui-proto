import React from 'react';
import { Upload, Cog, FileText, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import type { IngestionLog } from '../../services/ingestion';

interface OrchestrationStepperProps {
    log: IngestionLog | null;
}

const steps = [
    { id: 1, name: 'Upload', description: 'Landing FEC files', icon: Upload, statusMatch: 'Uploaded' },
    { id: 2, name: 'Engine Start', description: 'Import to Staging', icon: Cog, statusMatch: 'Processing', stepMatch: 'Importing' },
    { id: 3, name: 'Analytics', description: 'Generating Cubes', icon: FileText, statusMatch: 'Processing', stepMatch: 'Dimensions' },
    { id: 4, name: 'Ready', description: 'Mapping Available', icon: CheckCircle2, statusMatch: 'Completed' },
];

export const OrchestrationStepper: React.FC<OrchestrationStepperProps> = ({ log }) => {

    // Determine active step index based on log status and currentStep text
    const getActiveStep = () => {
        if (!log) return 0;
        if (log.status === 'Uploaded') return 1;
        if (log.status === 'Completed') return 4;
        if (log.status === 'Failed') return -1; // Special error state handling if needed

        // Granular processing steps
        const step = log.currentStep?.toLowerCase() || '';
        if (step.includes('staging') || step.includes('import')) return 2;
        if (step.includes('dimension') || step.includes('fact') || step.includes('cube')) return 3;

        return 2; // Default to step 2 if generic processing
    };

    const activeStep = getActiveStep();
    const isFailed = log?.status === 'Failed';

    return (
        <nav aria-label="Progress" className="mb-8">
            <ol className="flex items-center w-full">
                {steps.map((step, idx) => {
                    const isCompleted = activeStep > step.id || activeStep === 4; // 4 is final
                    const isCurrent = activeStep === step.id;
                    const isLast = idx === steps.length - 1;

                    return (
                        <li key={step.name} className={clsx("relative flex-1", !isLast && "pr-8 sm:pr-20")}>
                            <div className="flex items-center">
                                <div className={clsx(
                                    "z-10 flex h-10 w-10 items-center justify-center rounded-full transition-all duration-500",
                                    isCompleted ? "bg-emerald-500 text-white" :
                                        isCurrent ? "bg-brand-primary text-white ring-4 ring-brand-primary/20" :
                                            isFailed && isCurrent ? "bg-red-500 text-white" :
                                                "bg-slate-100 text-slate-400"
                                )}>
                                    {isCompleted ? <CheckCircle2 size={20} /> :
                                        isCurrent && log?.status === 'Processing' ? <Loader2 size={20} className="animate-spin" /> :
                                            isFailed && isCurrent ? <AlertTriangle size={20} /> :
                                                <step.icon size={20} />}
                                </div>
                                {!isLast && (
                                    <div className={clsx(
                                        "absolute top-5 left-10 h-1 w-full -z-0 transition-all duration-700",
                                        isCompleted ? "bg-emerald-500" : "bg-slate-100"
                                    )} />
                                )}
                            </div>
                            <div className="mt-3">
                                <span className={clsx(
                                    "text-xs font-bold uppercase tracking-wide block",
                                    isCompleted ? "text-emerald-600" :
                                        isCurrent ? "text-brand-primary" :
                                            isFailed && isCurrent ? "text-red-600" : "text-slate-400"
                                )}>{step.name}</span>
                                <span className="text-[10px] text-slate-500 font-medium hidden sm:block mt-1">{step.description}</span>
                            </div>
                        </li>
                    );
                })}
            </ol>

            {/* Live Status Text */}
            <div className="mt-8 flex items-center justify-center">
                <div className={clsx(
                    "px-4 py-2 rounded-full text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2",
                    log?.status === 'Processing' ? "bg-brand-primary/10 text-brand-primary" :
                        log?.status === 'Completed' ? "bg-emerald-100 text-emerald-700" :
                            log?.status === 'Failed' ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-500"
                )}>
                    {log?.status === 'Processing' && <Loader2 size={12} className="animate-spin" />}
                    {log?.status === 'Failed' && <AlertTriangle size={12} />}
                    Status: {log?.status} - {log?.currentStep || 'Waiting...'}
                </div>
            </div>
        </nav>
    );
};
