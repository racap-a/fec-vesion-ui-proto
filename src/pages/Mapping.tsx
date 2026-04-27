import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    DndContext, DragOverlay, useDraggable, useDroppable,
    type DragStartEvent, type DragEndEvent
} from '@dnd-kit/core';
import {
    Folder, GripVertical, Save, Lock, Sparkles, Pencil,
    AlertTriangle, ChevronDown, ChevronRight, RefreshCcw,
    Map as MapIcon, Loader2, Play, CheckCircle2
} from 'lucide-react';
import { clsx } from 'clsx';
import api from '../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 'checking' | 'idle' | 'prefix' | 'ai' | 'loading' | 'ready' | 'saving' | 'saved';
type MappingSource = 'auto' | 'ai' | 'manual';

interface MappingEntry {
    pcgCode: string;
    pcgName: string;
    source: MappingSource;
    accountName: string;
    balance: number;
}

interface FecAccount { accountId: string; accountName: string; balance: number; }

interface ApiNode {
    type: string; id: string; label: string;
    mappingSource?: string; balance?: number;
    children: ApiNode[];
}

interface TreeResponse {
    tree: ApiNode[];
    unmapped: FecAccount[];
    totalFecAccounts: number;
    mappedCount: number;
    unmappedCount: number;
}

// ─── Source Badge ──────────────────────────────────────────────────────────────

const SourceBadge = ({ source }: { source: MappingSource }) => {
    if (source === 'auto') return (
        <span title="Mappage automatique (préfixe PCG)">
            <Lock size={10} className="text-slate-400" />
        </span>
    );
    if (source === 'ai') return (
        <span title="Suggestion IA">
            <Sparkles size={10} className="text-purple-400" />
        </span>
    );
    return (
        <span title="Mappage manuel">
            <Pencil size={10} className="text-blue-400" />
        </span>
    );
};

// ─── FEC Chip (draggable) ──────────────────────────────────────────────────────

const FecChip = ({ accountId, accountName, balance, source }: {
    accountId: string; accountName: string; balance: number; source?: MappingSource;
}) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: accountId,
        data: { accountId, accountName, balance }
    });

    return (
        <div
            ref={setNodeRef} {...listeners} {...attributes}
            className={clsx(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-mono cursor-grab active:cursor-grabbing transition-all select-none",
                "bg-amber-50 border-amber-200 text-amber-900 hover:border-amber-400 hover:shadow-sm",
                isDragging && "opacity-40 ring-2 ring-amber-400/50"
            )}
        >
            <GripVertical size={11} className="text-amber-400 shrink-0" />
            <span>{accountId}</span>
            {source && <SourceBadge source={source} />}
        </div>
    );
};

// ─── PCG Drop Zone ─────────────────────────────────────────────────────────────

const PcgDropZone = ({ pcgCode, pcgName, fecChildren, onUnmap }: {
    pcgCode: string;
    pcgName: string;
    fecChildren: Array<{ id: string; name: string; balance: number; source: MappingSource }>;
    onUnmap: (fecId: string) => void;
}) => {
    const { setNodeRef, isOver } = useDroppable({
        id: `pcg-${pcgCode}`,
        data: { pcgCode, pcgName }
    });

    return (
        <div
            ref={setNodeRef}
            className={clsx(
                "rounded-lg border p-3 transition-colors min-h-[56px]",
                isOver
                    ? "border-blue-400 bg-blue-50 shadow-inner"
                    : fecChildren.length > 0
                        ? "border-blue-100 bg-slate-50"
                        : "border-slate-100 bg-slate-50/50"
            )}
        >
            {/* PCG header */}
            <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-blue-700 font-mono bg-blue-100 px-1.5 py-0.5 rounded">
                    {pcgCode}
                </span>
                <span className="text-xs text-slate-600 truncate">{pcgName}</span>
                {fecChildren.length > 0 && (
                    <span className="ml-auto text-xs text-slate-400 shrink-0">{fecChildren.length}</span>
                )}
            </div>

            {/* FEC chips */}
            {fecChildren.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                    {fecChildren.map(fec => (
                        <FecChip
                            key={fec.id}
                            accountId={fec.id}
                            accountName={fec.name}
                            balance={fec.balance}
                            source={fec.source}
                        />
                    ))}
                </div>
            ) : (
                <p className={clsx(
                    "text-xs text-slate-400 italic",
                    isOver && "text-blue-500 font-medium not-italic"
                )}>
                    {isOver ? "Déposer ici" : "Aucun compte"}
                </p>
            )}
        </div>
    );
};

// ─── Category Section ──────────────────────────────────────────────────────────

const CategorySection = ({ category, mappings, onUnmap }: {
    category: ApiNode;
    mappings: Record<string, MappingEntry>;
    onUnmap: (fecId: string) => void;
}) => {
    const fecCount = useMemo(() => {
        return category.children.reduce((total, pcg) => {
            return total + pcg.children.filter(c => mappings[c.id]).length +
                Object.values(mappings).filter(m => m.pcgCode === pcg.id).length;
        }, 0);
    }, [category, mappings]);

    // Auto-expand categories that have mapped accounts
    const [isOpen, setIsOpen] = useState(fecCount > 0);

    // Collect FEC accounts under each PCG from mappings
    const pcgWithChildren = category.children.map(pcg => {
        const children = Object.entries(mappings)
            .filter(([, m]) => m.pcgCode === pcg.id)
            .map(([fecId, m]) => ({ id: fecId, name: m.accountName, balance: m.balance, source: m.source }))
            .sort((a, b) => a.id.localeCompare(b.id));
        return { pcg, children };
    });

    const totalMapped = pcgWithChildren.reduce((s, p) => s + p.children.length, 0);

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <button
                onClick={() => setIsOpen(v => !v)}
                className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors text-left"
            >
                <Folder size={18} className="text-amber-500 fill-amber-100 shrink-0" />
                <span className="font-bold text-slate-800 flex-1 truncate">{category.label}</span>
                {totalMapped > 0 && (
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        {totalMapped} compte{totalMapped > 1 ? 's' : ''}
                    </span>
                )}
                {isOpen
                    ? <ChevronDown size={16} className="text-slate-400 shrink-0" />
                    : <ChevronRight size={16} className="text-slate-400 shrink-0" />
                }
            </button>

            {isOpen && (
                <div className="px-4 pb-4 space-y-2 border-t border-slate-100 pt-3">
                    {pcgWithChildren.map(({ pcg, children }) => (
                        <PcgDropZone
                            key={pcg.id}
                            pcgCode={pcg.id}
                            pcgName={pcg.label.split(' - ').slice(1).join(' - ')}
                            fecChildren={children}
                            onUnmap={onUnmap}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// ─── Phase Progress ────────────────────────────────────────────────────────────

const PhaseProgress = ({ phase, prefixResult, aiResult }: {
    phase: Phase;
    prefixResult: { matched: number; unmatched: number } | null;
    aiResult: { suggested: number } | null;
}) => {
    const steps = [
        {
            id: 'prefix',
            label: 'Mapping par préfixe PCG',
            desc: prefixResult ? `${prefixResult.matched} comptes mappés automatiquement` : 'Analyse des numéros de comptes...',
            done: !!prefixResult,
            active: phase === 'prefix',
        },
        {
            id: 'ai',
            label: 'Complétion par IA (Gemini)',
            desc: phase === 'ai'
                ? 'Démarrage en arrière-plan...'
                : prefixResult
                    ? `${prefixResult.unmatched} comptes envoyés à l'IA`
                    : 'En attente...',
            done: phase === 'loading' || phase === 'ready' || phase === 'saved',
            active: phase === 'ai',
        },
        {
            id: 'loading',
            label: 'Chargement de la vue',
            desc: 'Construction de l\'arborescence...',
            done: phase === 'ready' || phase === 'saved',
            active: phase === 'loading',
        },
    ];

    return (
        <div className="h-full flex items-center justify-center bg-slate-50">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 w-full max-w-md">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-brand-primary/10 p-3 rounded-xl">
                        <MapIcon size={22} className="text-brand-primary" />
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-900">Mapping automatique en cours</h2>
                        <p className="text-xs text-slate-500 mt-0.5">Ne fermez pas cette page</p>
                    </div>
                </div>
                <div className="space-y-4">
                    {steps.map(step => (
                        <div key={step.id} className="flex items-start gap-3">
                            <div className="shrink-0 mt-0.5">
                                {step.done ? (
                                    <CheckCircle2 size={18} className="text-emerald-500" />
                                ) : step.active ? (
                                    <Loader2 size={18} className="text-brand-primary animate-spin" />
                                ) : (
                                    <div className="w-[18px] h-[18px] rounded-full border-2 border-slate-200" />
                                )}
                            </div>
                            <div>
                                <p className={clsx(
                                    "text-sm font-semibold",
                                    step.done ? "text-emerald-700" : step.active ? "text-slate-900" : "text-slate-400"
                                )}>{step.label}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ─── Main Component ────────────────────────────────────────────────────────────

export default function Mapping() {
    const { user } = useAuth();
    const companyId = user?.companyId;

    const [phase, setPhase] = useState<Phase>('checking');
    const [treeResponse, setTreeResponse] = useState<TreeResponse | null>(null);
    const [mappings, setMappings] = useState<Record<string, MappingEntry>>({});
    const [prefixResult, setPrefixResult] = useState<{ matched: number; unmatched: number } | null>(null);
    const [aiResult, setAiResult] = useState<{ suggested: number } | null>(null);
    const [activeDrag, setActiveDrag] = useState<{ accountId: string; accountName: string } | null>(null);
    const [saveMsg, setSaveMsg] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [aiRunning, setAiRunning] = useState(false);

    // Load tree from API and populate local mappings map
    const loadTree = useCallback(async () => {
        if (!companyId) return;
        setPhase('loading');
        try {
            const res = await api.get<TreeResponse>(`/mapping/${companyId}/tree`);
            const data = res.data;
            setTreeResponse(data);

            // Populate flat mappings map from API tree
            const flat: Record<string, MappingEntry> = {};
            data.tree.forEach(category => {
                category.children.forEach(pcg => {
                    pcg.children.forEach(fec => {
                        flat[fec.id] = {
                            pcgCode: pcg.id,
                            pcgName: pcg.label.replace(`${pcg.id} - `, ''),
                            source: (fec.mappingSource as MappingSource) || 'auto',
                            accountName: fec.label.replace(`${fec.id} - `, ''),
                            balance: fec.balance ?? 0,
                        };
                    });
                });
            });
            setMappings(flat);
            setPhase('ready');
        } catch {
            setError('Impossible de charger l\'arborescence.');
            setPhase('idle');
        }
    }, [companyId]);

    // On mount: check if mappings already exist
    useEffect(() => {
        if (!companyId) return;
        api.get<TreeResponse>(`/mapping/${companyId}/tree`).then(res => {
            if (res.data.mappedCount > 0) {
                setTreeResponse(res.data);
                const flat: Record<string, MappingEntry> = {};
                res.data.tree.forEach(cat => {
                    cat.children.forEach(pcg => {
                        pcg.children.forEach(fec => {
                            flat[fec.id] = {
                                pcgCode: pcg.id,
                                pcgName: pcg.label.replace(`${pcg.id} - `, ''),
                                source: (fec.mappingSource as MappingSource) || 'auto',
                                accountName: fec.label.replace(`${fec.id} - `, ''),
                                balance: fec.balance ?? 0,
                            };
                        });
                    });
                });
                setMappings(flat);
                setPhase('ready');
            } else {
                setPhase('idle');
            }
        }).catch(() => setPhase('idle'));
    }, [companyId]);

    // Run full auto-mapping pipeline: prefix → fire ai in background → load tree immediately
    const startAutoMapping = useCallback(async () => {
        if (!companyId) return;
        setError(null);
        setPrefixResult(null);
        setAiResult(null);
        setAiRunning(false);

        try {
            // Step 1: prefix-match (fast, wait for it)
            setPhase('prefix');
            const pRes = await api.post(`/mapping/${companyId}/prefix-match`);
            setPrefixResult({ matched: pRes.data.matched, unmatched: pRes.data.unmatched });

            // Step 2: fire ai-suggest in background — backend returns 202 immediately
            if (pRes.data.unmatched > 0) {
                setPhase('ai');
                await api.post(`/mapping/${companyId}/ai-suggest`); // returns 202 instantly
                setAiRunning(true);
            }

            // Step 3: load tree with whatever is mapped so far
            await loadTree();
            // If nothing is unmapped after tree load, AI finished — dismiss banner
            setAiRunning(prev => prev && unmappedAccounts.length > 0);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur lors du mapping automatique.');
            setPhase('idle');
        }
    }, [companyId, loadTree]);

    // Drag handlers
    const handleDragStart = (e: DragStartEvent) => {
        const data = e.active.data.current as any;
        setActiveDrag({ accountId: e.active.id as string, accountName: data?.accountName ?? '' });
    };

    const handleDragEnd = (e: DragEndEvent) => {
        setActiveDrag(null);
        const { active, over } = e;
        if (!over) return;

        const fecId = active.id as string;
        const data = over.data.current as any;
        if (!data?.pcgCode) return;

        // If dropped on same PCG, no change
        if (mappings[fecId]?.pcgCode === data.pcgCode) return;

        const activeData = active.data.current as any;

        setMappings(prev => ({
            ...prev,
            [fecId]: {
                pcgCode: data.pcgCode,
                pcgName: data.pcgName,
                source: 'manual',
                accountName: prev[fecId]?.accountName ?? activeData?.accountName ?? '',
                balance: prev[fecId]?.balance ?? activeData?.balance ?? 0,
            }
        }));
    };

    // Save
    const handleSave = async () => {
        if (!companyId) return;
        setPhase('saving');
        setSaveMsg(null);
        try {
            const payload = Object.entries(mappings).map(([fecId, m]) => ({
                sourceAccountId: fecId,
                sourceAccountName: m.accountName,
                targetPcgCode: m.pcgCode,
                targetPcgName: m.pcgName,
                mappingSource: m.source,
            }));
            const res = await api.post(`/mapping/${companyId}/save-tree`, { mappings: payload });
            setSaveMsg(`${res.data.saved} mappings enregistrés.`);
            setPhase('saved');
        } catch {
            setError('Erreur lors de l\'enregistrement.');
            setPhase('ready');
        }
    };

    // Unmapped FEC accounts (in treeResponse.unmapped, not in local mappings map)
    const unmappedAccounts = useMemo(() => {
        if (!treeResponse) return [];
        return treeResponse.unmapped.filter(a => !mappings[a.accountId]);
    }, [treeResponse, mappings]);

    const mappedCount = Object.keys(mappings).length;
    const totalCount = treeResponse?.totalFecAccounts ?? 0;

    // ── Render phases ────────────────────────────────────────────────────────

    if (phase === 'checking') {
        return (
            <div className="h-full flex items-center justify-center bg-slate-50">
                <Loader2 size={28} className="text-brand-primary animate-spin" />
            </div>
        );
    }

    if (phase === 'prefix' || phase === 'ai' || phase === 'loading') {
        return <PhaseProgress phase={phase} prefixResult={prefixResult} aiResult={aiResult} />;
    }

    if (phase === 'idle') {
        return (
            <div className="h-full flex items-center justify-center bg-slate-50 p-8">
                <div className="bg-white rounded-2xl p-10 shadow-sm border border-slate-200 max-w-md w-full text-center">
                    <div className="bg-brand-primary/10 p-4 rounded-2xl inline-flex mb-6">
                        <MapIcon size={32} className="text-brand-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Mapping PCG automatique</h2>
                    <p className="text-slate-500 text-sm mb-8">
                        Le système va mapper vos comptes FEC au Plan Comptable Général par correspondance de préfixe, puis l'IA complétera les comptes sans correspondance directe.
                    </p>
                    {error && (
                        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>
                    )}
                    <button
                        onClick={startAutoMapping}
                        className="flex items-center gap-2 mx-auto bg-brand-primary text-white px-8 py-3.5 rounded-xl font-bold hover:bg-brand-primary/90 hover:-translate-y-0.5 transition-all shadow-lg"
                    >
                        <Play size={18} />
                        Lancer le mapping automatique
                    </button>
                </div>
            </div>
        );
    }

    // ── Ready / Saved ────────────────────────────────────────────────────────

    return (
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="h-full flex flex-col bg-slate-50">

                {/* Header */}
                <header className="bg-white border-b border-slate-200 px-8 py-4 shrink-0 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-brand-primary/10 p-2.5 rounded-xl">
                            <MapIcon size={20} className="text-brand-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Mapping PCG</h1>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {mappedCount} / {totalCount} comptes mappés
                                {unmappedAccounts.length > 0 && (
                                    <span className="text-amber-600 ml-2">· {unmappedAccounts.length} sans correspondance</span>
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Legend */}
                        <div className="hidden lg:flex items-center gap-3 text-xs text-slate-500 mr-4">
                            <span className="flex items-center gap-1"><Lock size={11} /> Auto</span>
                            <span className="flex items-center gap-1"><Sparkles size={11} className="text-purple-400" /> IA</span>
                            <span className="flex items-center gap-1"><Pencil size={11} className="text-blue-400" /> Manuel</span>
                        </div>
                        <button
                            onClick={startAutoMapping}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                            <RefreshCcw size={14} />
                            Relancer
                        </button>
                    </div>
                </header>

                {/* Notifications */}
                {saveMsg && (
                    <div className="mx-8 mt-4 shrink-0 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-700 text-sm font-medium">
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                        {saveMsg}
                    </div>
                )}
                {error && (
                    <div className="mx-8 mt-4 shrink-0 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                        {error}
                    </div>
                )}
                {aiRunning && (
                    <div className="mx-8 mt-4 shrink-0 p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-purple-700 text-sm">
                            <Loader2 size={15} className="animate-spin shrink-0" />
                            <span>L'IA complète le mapping en arrière-plan — actualisez dans 1-2 min pour voir les résultats.</span>
                        </div>
                        <button
                            onClick={async () => { await loadTree(); setAiRunning(false); }}
                            className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-purple-700 bg-purple-100 hover:bg-purple-200 px-3 py-1.5 rounded-lg transition-colors"
                        >
                            <RefreshCcw size={12} />
                            Actualiser
                        </button>
                    </div>
                )}

                {/* Scrollable tree */}
                <div className="flex-1 overflow-y-auto p-8 pb-28 custom-scrollbar">
                    <div className="max-w-5xl mx-auto space-y-3">

                        {/* Unmapped section — top, needs attention */}
                        {unmappedAccounts.length > 0 && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                                <h3 className="flex items-center gap-2 text-sm font-bold text-amber-800 mb-3">
                                    <AlertTriangle size={15} />
                                    {unmappedAccounts.length} compte{unmappedAccounts.length > 1 ? 's' : ''} sans correspondance — glissez-les vers un compte PCG
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {unmappedAccounts.map(fec => (
                                        <FecChip
                                            key={fec.accountId}
                                            accountId={fec.accountId}
                                            accountName={fec.accountName}
                                            balance={fec.balance}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 3-layer tree */}
                        {treeResponse?.tree.map(category => (
                            <CategorySection
                                key={category.id}
                                category={category}
                                mappings={mappings}
                                onUnmap={() => {}} // reassign only, no unmap
                            />
                        ))}
                    </div>
                </div>

                {/* Fixed save bar */}
                <div className="absolute bottom-0 left-0 right-0 p-5 bg-white/90 backdrop-blur-sm border-t border-slate-200 z-20">
                    <div className="max-w-5xl mx-auto flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={phase === 'saving' || phase === 'saved' || mappedCount === 0}
                            className="flex items-center gap-2 bg-brand-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-brand-primary/90 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {phase === 'saving'
                                ? <Loader2 size={18} className="animate-spin" />
                                : <Save size={18} />
                            }
                            {phase === 'saving' ? 'Enregistrement...' : 'Enregistrer le mapping'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Drag ghost */}
            <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
                {activeDrag && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-mono bg-slate-900 border-brand-primary text-white shadow-2xl scale-105 rotate-2">
                        <GripVertical size={11} />
                        {activeDrag.accountId}
                    </div>
                )}
            </DragOverlay>
        </DndContext>
    );
}
