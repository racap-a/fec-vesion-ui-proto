import React, { useState, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    DndContext,
    DragOverlay,
    useDraggable,
    useDroppable,
    type DragStartEvent,
    type DragEndEvent
} from '@dnd-kit/core';
import { Sparkles, Save, GripVertical, AlertTriangle, RefreshCcw, CheckCircle2, FileDigit, Play } from 'lucide-react';
import { clsx } from 'clsx';
import api from '../services/api';

// --- Types ---
export interface PnlNodeDto {
    nodeId: string;
    level1: string;
    level2?: string | null;
    level3?: string | null;
    level4?: string | null;
    level5?: string | null;
    mappedAccounts: string[];
    ordre: number;
    naturalKey?: string | null;
}

export interface SaveValidatedRequest {
    companyId: number;
    hierarchy: PnlNodeDto[];
    userId: null;
}

// --- Sub Components ---

// Draggable Chip
const AccountChip = ({ account }: { account: string }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: account
    });

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={clsx(
                "flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-md text-sm font-mono text-slate-700 cursor-grab hover:border-brand-primary hover:text-brand-primary shadow-sm transition-colors",
                isDragging && "opacity-50 ring-2 ring-brand-primary/50",
                "active:cursor-grabbing"
            )}
        >
            <GripVertical size={14} className="text-slate-400 group-hover:text-brand-primary" />
            {account}
        </div>
    );
};

// Droppable Zone (Level 2)
const DroppableSubHeader = ({ 
    node, 
    children, 
    errorMsg 
}: { 
    node: PnlNodeDto, 
    children: React.ReactNode,
    errorMsg?: string | null
}) => {
    const { setNodeRef, isOver } = useDroppable({
        id: node.nodeId
    });

    return (
        <div 
            ref={setNodeRef}
            className={clsx(
                "p-4 rounded-xl border transition-colors flex flex-col min-h-[100px]",
                isOver ? "bg-brand-primary/5 border-brand-primary/50 shadow-inner" : "bg-slate-50 border-slate-200",
                errorMsg && "border-red-300 bg-red-50/50"
            )}
        >
            <div className="flex justify-between items-center mb-3 border-b border-slate-200/60 pb-2">
                <span className="text-sm font-bold text-slate-800">{node.level2 || 'Sans catégorie (Niveau 2)'}</span>
                <span className="bg-white px-2 py-0.5 rounded text-xs text-slate-500 font-mono border border-slate-100 shadow-sm">
                    {node.mappedAccounts.length}
                </span>
            </div>
            
            <div className="flex flex-wrap gap-2 flex-1 content-start">
                {children}
            </div>

            {errorMsg && (
                <div className="mt-3 text-xs text-red-600 font-medium flex items-center gap-1.5 bg-red-50 p-1.5 rounded-md border border-red-100">
                    <AlertTriangle size={14} />
                    {errorMsg}
                </div>
            )}
        </div>
    );
};

// --- Main Validation Component ---
export default function AIPnlValidation() {
    const { user } = useAuth();

    // State
    const [nodes, setNodes] = useState<PnlNodeDto[]>([]);
    
    // Status States
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationError, setGenerationError] = useState<string | null>(null);
    
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
    const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);
    
    // Interaction States
    const [activeAccount, setActiveAccount] = useState<string | null>(null);
    const [nodeErrors, setNodeErrors] = useState<Record<string, string>>({});

    // Fetch / Generate Data
    const generateHierarchy = useCallback(async () => {
        if (!user?.companyId) return;
        
        setIsGenerating(true);
        setGenerationError(null);
        setSaveSuccessMsg(null);
        setSaveErrorMsg(null);

        try {
            const res = await api.post(`/ai-mapping/extract-and-generate/${user.companyId}`);
            const data = res.data;

            // Attempt to parse standard hierarchy structure
            if (data.pnlHierarchy?.hierarchy?.length > 0) {
                setNodes(data.pnlHierarchy.hierarchy);
            } else if (Array.isArray(data)) {
                // Fallback if backend directly returns the array
                setNodes(data);
            } else {
                throw new Error("Format de réponse inattendu.");
            }
        } catch (err: any) {
            console.error("AI Generation Error", err);
            setGenerationError(
                err.response?.data?.message || 
                err.message || 
                "Une erreur est survenue lors de l'analyse IA."
            );
        } finally {
            setIsGenerating(false);
        }
    }, [user?.companyId]);

    // Grouping for Display
    const groupedNodes = useMemo(() => {
        const groups: Record<string, PnlNodeDto[]> = {};
        nodes.forEach(node => {
            const l1 = node.level1 || 'Indéfini';
            if (!groups[l1]) groups[l1] = [];
            groups[l1].push(node);
        });
        
        Object.keys(groups).forEach(key => {
            groups[key].sort((a, b) => a.ordre - b.ordre);
        });
        
        return groups;
    }, [nodes]);

    // --- Drag & Drop ---
    const handleDragStart = (event: DragStartEvent) => {
        setActiveAccount(event.active.id as string);
        setNodeErrors({}); // Clear inline warnings on new drag
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveAccount(null);

        if (!over) return;

        const draggedAccountId = active.id as string;
        const targetNodeId = over.id as string;

        // 1. Find the source node
        const sourceNode = nodes.find(n => n.mappedAccounts.includes(draggedAccountId));
        // 2. Find the target node
        const targetNode = nodes.find(n => n.nodeId === targetNodeId);

        // 3. Early Returns
        if (!sourceNode || !targetNode) return;
        if (sourceNode.nodeId === targetNode.nodeId) return; // Dropped in same group

        // 4. Empty-node guard logic
        if (sourceNode.mappedAccounts.length <= 1) {
            setNodeErrors({
                [sourceNode.nodeId]: "Un nœud doit contenir au moins un compte."
            });
            return; // Block the drop
        }

        // 5. Mutate State
        setNodes(prevNodes => prevNodes.map(node => {
            if (node.nodeId === sourceNode.nodeId) {
                return {
                    ...node,
                    mappedAccounts: node.mappedAccounts.filter(acc => acc !== draggedAccountId)
                };
            }
            if (node.nodeId === targetNode.nodeId) {
                // Avoid duplicates visually just in case
                const newSet = new Set([...node.mappedAccounts, draggedAccountId]);
                return {
                    ...node,
                    mappedAccounts: Array.from(newSet).sort()
                };
            }
            return node;
        }));
    };

    // --- Save Logic ---
    const handleSave = async () => {
        if (!user?.companyId) return;
        
        setIsSaving(true);
        setSaveErrorMsg(null);
        setNodeErrors({});

        // Payload structure based exactly on specification
        const payload: SaveValidatedRequest = {
            companyId: user.companyId,
            hierarchy: nodes,
            userId: null
        };

        console.log("Saving Validated Hierarchy Payload:", JSON.stringify(payload, null, 2));

        try {
            const res = await api.post(`/ai-mapping/save-validated/${user.companyId}`, payload);
            
            // Expected response fields based on spec
            const pRes = res.data.presentationsResult?.nodesSaved || 0;
            const cRes = res.data.componentsResult?.componentsSaved || 0;

            setSaveSuccessMsg(`Hiérarchie P&L validée — ${pRes} nœuds enregistrés, ${cRes} comptes liés.`);
        } catch (err: any) {
            console.error("Save Validation Error", err);
            setSaveErrorMsg("Erreur lors de l'enregistrement. Vos corrections sont conservées.");
        } finally {
            setIsSaving(false);
        }
    };

    // --- Renders ---

    if (!isGenerating && !generationError && nodes.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-slate-50">
                <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center max-w-md text-center">
                    <div className="bg-brand-primary/10 text-brand-primary p-4 rounded-2xl border border-brand-primary/20 mb-6">
                        <Sparkles size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Validation IA P&L</h2>
                    <p className="text-slate-500 mb-8">Lancez l'analyse pour générer la hiérarchie P&L à partir de votre balance comptable.</p>
                    <button
                        onClick={generateHierarchy}
                        className="flex items-center gap-2 bg-brand-primary text-white px-8 py-3.5 rounded-xl text-sm font-bold shadow-lg hover:bg-brand-primary/90 hover:-translate-y-0.5 transition-all"
                    >
                        <Play size={18} />
                        Lancer l'analyse IA
                    </button>
                </div>
            </div>
        );
    }

    if (isGenerating) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-slate-50">
                <div className="relative">
                    <div className="absolute inset-0 bg-brand-primary/20 blur-xl rounded-full animate-pulse"></div>
                    <div className="bg-white p-6 rounded-2xl shadow-xl relative z-10 border border-slate-100 flex flex-col items-center">
                        <Sparkles className="w-12 h-12 text-brand-primary animate-pulse mb-6" />
                        <h2 className="text-xl font-bold text-slate-800 tracking-tight">L'IA analyse votre balance comptable...</h2>
                        <p className="text-slate-500 font-medium mt-2">Génération de la hiérarchie P&L en cours</p>
                    </div>
                </div>
            </div>
        );
    }

    if (generationError) {
        return (
            <div className="h-full flex items-center justify-center bg-slate-50">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 max-w-md w-full text-center">
                    <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Échec de l'analyse</h2>
                    <p className="text-slate-600 mb-8">{generationError}</p>
                    <button 
                        onClick={generateHierarchy}
                        className="flex items-center justify-center gap-2 w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors"
                    >
                        <RefreshCcw size={18} />
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    return (
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="h-full flex flex-col bg-slate-50 relative">
                
                {/* Header Area */}
                <header className="bg-white border-b border-slate-200 px-8 py-5 shrink-0 z-10 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="bg-brand-primary/10 text-brand-primary p-3 rounded-xl border border-brand-primary/20">
                            <Sparkles size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Validation IA P&L</h1>
                            <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-2">
                                <FileDigit size={14} />
                                Glissez et déposez les comptes pour ajuster la proposition de la direction financière.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={generateHierarchy}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        <RefreshCcw size={15} />
                        Regénérer
                    </button>
                </header>

                {/* Notifications */}
                {saveErrorMsg && (
                    <div className="mx-8 mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 font-medium shrink-0 shadow-sm">
                        <AlertTriangle size={20} className="shrink-0" />
                        {saveErrorMsg}
                    </div>
                )}

                {saveSuccessMsg && (
                    <div className="mx-8 mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-700 font-medium shrink-0 shadow-sm">
                        <CheckCircle2 size={20} className="shrink-0 text-emerald-500" />
                        {saveSuccessMsg}
                    </div>
                )}

                {/* Scrollable Content Block */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar pb-32">
                    <div className="max-w-7xl mx-auto space-y-12">
                        {Object.entries(groupedNodes).map(([level1, groupNodes]) => (
                            <div key={level1} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
                                
                                {/* Level 1 Header */}
                                <h2 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-3">
                                    <span className="w-1.5 h-6 bg-slate-800 rounded-full inline-block"></span>
                                    {level1}
                                </h2>

                                {/* Level 2 Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {groupNodes.map(node => (
                                        <DroppableSubHeader 
                                            key={node.nodeId} 
                                            node={node}
                                            errorMsg={nodeErrors[node.nodeId]}
                                        >
                                            {node.mappedAccounts.map(account => (
                                                <AccountChip key={account} account={account} />
                                            ))}
                                        </DroppableSubHeader>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {Object.keys(groupedNodes).length === 0 && (
                            <div className="text-center py-20 text-slate-500 bg-white rounded-2xl border border-dashed border-slate-300">
                                Aucune hiérarchie trouvée pour révision.
                            </div>
                        )}
                    </div>
                </div>

                {/* Fixed Footer for Save Action */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-slate-200 z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                    <div className="max-w-7xl mx-auto flex justify-end">
                        <button 
                            onClick={handleSave}
                            disabled={isSaving || !!saveSuccessMsg || Object.keys(groupedNodes).length === 0}
                            className="flex items-center gap-2 bg-brand-primary text-white px-8 py-3.5 rounded-xl text-sm font-bold shadow-lg hover:bg-brand-primary/90 hover:-translate-y-0.5 transition-all disabled:opacity-75 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                        >
                            {isSaving ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Save size={18} />
                            )}
                            {isSaving ? 'Enregistrement...' : 'Valider et Enregistrer'}
                        </button>
                    </div>
                </div>

            </div>

            {/* Ghost Element for drag overlay */}
            <DragOverlay dropAnimation={{ duration: 250, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
                {activeAccount ? (
                    <div className="opacity-95 shadow-2xl scale-110 rotate-3 cursor-grabbing">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border-2 border-brand-primary rounded-lg text-sm font-mono text-white font-bold">
                            <GripVertical size={14} className="text-brand-primary" />
                            {activeAccount}
                        </div>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
