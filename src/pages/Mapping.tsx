import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, ChevronRight, ChevronDown, GripVertical, Save, Folder, FileDigit, X, CheckCircle2, Loader2, AlertCircle, AlertTriangle, Map as MapIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { DndContext, DragOverlay, useDraggable, useDroppable, type DragStartEvent, type DragEndEvent } from '@dnd-kit/core';
import api from '../services/api';

// --- Data Models ---
export interface UnmappedAccount {
    accountId: string;
    accountName: string;
    balance: number;
}

export interface TreeNode {
    id: string;
    type: 'category' | 'pals_account' | 'mapped_account';
    label: string;
    children?: TreeNode[];
    isOpen?: boolean;
    // Only present if type === 'mapped_account'
    sourceAccountId?: string;
    balance?: number;
}

export interface MappingPayloadDto {
    sourceAccountId: string;
    sourceAccountName: string;
    targetPcgCode: string;
    targetPcgName: string;
}

// --- Sub-components ---

// 1. Draggable Account Item (Right Pane)
const DraggableAccountItem = ({ account }: { account: UnmappedAccount }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: account.accountId,
        data: { account }
    });

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={clsx(
                "flex items-center justify-between p-3 rounded-xl mb-2 border border-slate-200 shadow-sm cursor-grab active:cursor-grabbing transition-all bg-white",
                "hover:border-brand-primary/50 hover:bg-brand-primary/5 hover:shadow-md",
                isDragging && "opacity-50 ring-2 ring-brand-primary/50"
            )}
        >
            <div className="flex items-center gap-3">
                <div className="text-slate-400">
                    <GripVertical size={16} />
                </div>
                <div>
                    <div className="text-sm font-bold text-slate-800 font-mono">{account.accountId}</div>
                    <div className="text-xs text-slate-500 truncate max-w-[160px]">{account.accountName}</div>
                </div>
            </div>
            <div className="text-xs font-mono font-medium text-slate-900 bg-slate-100 px-2 py-1 rounded">
                {account.balance.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </div>
        </div>
    );
};

// 2. Droppable Tree Node (Left Pane)
interface DroppableTreeNodeProps {
    node: TreeNode;
    level: number;
    onToggle: (id: string) => void;
    onUnmap: (id: string) => void;
    renderChildren: (children: TreeNode[], level: number) => React.ReactNode;
}

const DroppableTreeNode: React.FC<DroppableTreeNodeProps> = ({ node, level, onToggle, onUnmap, renderChildren }) => {
    // Only pals_account are valid drop targets
    const isDroppable = node.type === 'pals_account';

    // We prefix the tree node ID so we don't collide with account IDs
    const { setNodeRef, isOver } = useDroppable({
        id: `node-${node.id}`,
        data: { nodeId: node.id },
        disabled: !isDroppable
    });

    const isMappedAccount = node.type === 'mapped_account';

    return (
        <div className="select-none">
            <div
                ref={setNodeRef}
                className={clsx(
                    "flex justify-between items-center py-1.5 px-2 hover:bg-slate-100/10 rounded transition-colors border",
                    isOver ? "border-brand-primary bg-brand-primary/10" : "border-transparent",
                    level > 0 && "ml-4",
                    node.type === 'pals_account' && "text-blue-200 font-semibold",
                    isMappedAccount && "bg-brand-primary/10 border-brand-primary/20 rounded-md"
                )}
            >
                {/* Visual Label Area */}
                <div
                    className="flex items-center gap-2 cursor-pointer flex-1"
                    onClick={() => node.children && onToggle(node.id)}
                >
                    <div className="w-4 h-4 flex items-center justify-center shrink-0">
                        {node.children && !isMappedAccount && (
                            node.isOpen ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />
                        )}
                        {isMappedAccount && <CheckCircle2 size={12} className="text-brand-primary" />}
                    </div>

                    {!isMappedAccount && node.type === 'category' && <Folder size={14} className="text-amber-500 fill-amber-500/20" />}
                    {!isMappedAccount && node.type === 'pals_account' && <FileDigit size={14} className="text-blue-400" />}

                    <span className={clsx(
                        "truncate",
                        isMappedAccount ? "font-mono text-sm text-brand-primary ml-1 font-medium" : "text-sm",
                        isOver && "font-bold text-white"
                    )}>
                        {node.label}
                    </span>

                    {isMappedAccount && node.balance !== undefined && (
                        <span className="text-xs font-mono text-slate-400 bg-slate-900/50 px-1.5 py-0.5 rounded ml-2">
                            {node.balance.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </span>
                    )}
                </div>

                {/* Actions (Remove mapping) */}
                {isMappedAccount && (
                    <button
                        onClick={() => node.sourceAccountId && onUnmap(node.sourceAccountId)}
                        className="text-slate-500 hover:text-red-400 hover:bg-red-400/10 p-1 rounded transition-colors"
                        title="Remove Mapping"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {/* Recursively render children */}
            {node.isOpen && node.children && (
                <div className="border-l border-slate-700/50 ml-[1.15rem]">
                    {renderChildren(node.children, level + 1)}
                </div>
            )}
        </div>
    );
};


// --- Main Component ---
const Mapping = () => {
    const { user } = useAuth();
    const [treeData, setTreeData] = useState<TreeNode[]>([]);
    const [unmappedAccounts, setUnmappedAccounts] = useState<UnmappedAccount[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);

    // For Drag Overlay
    const [activeAccount, setActiveAccount] = useState<UnmappedAccount | null>(null);

    // --- Data Fetching ---
    useEffect(() => {
        const fetchData = async () => {
            if (!user?.companyId) return;
            
            setIsLoading(true);
            setError(null);
            
            try {
                // Run in parallel
                const [treeRes, unmappedRes] = await Promise.all([
                    api.get(`/mapping/${user.companyId}/pcg-tree`),
                    api.get(`/mapping/${user.companyId}/unmapped`)
                ]);
                
                setTreeData(treeRes.data.tree);
                
                const accounts = unmappedRes.data.accounts.map((acc: any) => ({
                    accountId: acc.accountId,
                    accountName: acc.accountName,
                    balance: acc.balance
                }));
                setUnmappedAccounts(accounts);
            } catch (err) {
                console.error("Failed to load mapping data:", err);
                setError("Impossible de charger la structure PCG.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user?.companyId]);

    // --- Interaction Handlers ---

    // Toggle node open/closed
    const handleToggleNode = (nodeId: string) => {
        const toggleRecursive = (nodes: TreeNode[]): TreeNode[] => {
            return nodes.map(node => {
                if (node.id === nodeId) {
                    return { ...node, isOpen: !node.isOpen };
                }
                if (node.children) {
                    return { ...node, children: toggleRecursive(node.children) };
                }
                return node;
            });
        };
        setTreeData(toggleRecursive(treeData));
    };

    // Unmap an account (move from Left to Right)
    const handleUnmap = (sourceAccountId: string) => {
        let removedNode: TreeNode | undefined;

        // 1. Remove from Tree recursively
        const removeRecursive = (nodes: TreeNode[]): TreeNode[] => {
            return nodes.map(node => {
                if (node.children) {
                    // Check if child is the one being removed
                    const targetIndex = node.children.findIndex(c => c.sourceAccountId === sourceAccountId);
                    if (targetIndex > -1) {
                        removedNode = node.children[targetIndex];
                        return {
                            ...node,
                            children: node.children.filter(c => c.sourceAccountId !== sourceAccountId)
                        };
                    }
                    // Otherwise continue deeper
                    return { ...node, children: removeRecursive(node.children) };
                }
                return node;
            });
        };

        const newTreeData = removeRecursive(treeData);

        if (removedNode && removedNode.sourceAccountId && removedNode.balance !== undefined) {
            // 2. Add back to Unmapped list
            const restoredAccount: UnmappedAccount = {
                accountId: removedNode.sourceAccountId,
                // Simple restoration of name by stripping ID, ideally store full name in TreeNode
                accountName: removedNode.label.replace(`${removedNode.sourceAccountId} - `, ''),
                balance: removedNode.balance
            };

            setTreeData(newTreeData);
            setUnmappedAccounts(prev => [...prev, restoredAccount].sort((a, b) => a.accountId.localeCompare(b.accountId)));
        }
    };

    // --- Drag and Drop Logic ---
    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const account = active.data.current?.account as UnmappedAccount;
        if (account) {
            setActiveAccount(account);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveAccount(null);

        // If dropped outside a valid droppable area
        if (!over) return;

        const accountId = active.id as string;
        const targetNodeId = (over.id as string).replace('node-', ''); // Extract clean ID
        const account = active.data.current?.account as UnmappedAccount;

        if (!account) return;

        // 1. Remove from Right Pane
        setUnmappedAccounts(prev => prev.filter(a => a.accountId !== accountId));

        // 2. Add as mapped_account to Target Node in Left Pane
        const addToTreeRecursive = (nodes: TreeNode[]): TreeNode[] => {
            return nodes.map(node => {
                if (node.id === targetNodeId) {
                    const newMappedNode: TreeNode = {
                        id: `mapped-${account.accountId}`, // Unique ID for the tree node
                        type: 'mapped_account',
                        label: `${account.accountId} - ${account.accountName}`,
                        sourceAccountId: account.accountId,
                        balance: account.balance
                    };
                    return {
                        ...node,
                        children: [...(node.children || []), newMappedNode],
                        isOpen: true // Auto-expand to show the drop
                    };
                }
                if (node.children) {
                    return { ...node, children: addToTreeRecursive(node.children) };
                }
                return node;
            });
        };

        setTreeData(addToTreeRecursive(treeData));
    };

    // --- API / Save Logic ---
    const handleSyncClick = async () => {
        if (!user?.companyId) return;
        setIsSaving(true);
        setError(null);
        setSaveSuccess(null);
        setSaveError(null);

        const payload: MappingPayloadDto[] = [];

        // Recursive extractor
        const extractMappings = (nodes: TreeNode[], parentPcgCode: string | null = null, parentPcgName: string | null = null) => {
            nodes.forEach(node => {
                // Determine the current PCG target (only pals_account nodes act as the target)
                // If it's a category, we pass down whatever the parent's target was (usually none)
                const currentTargetId = node.type === 'pals_account' ? node.id : parentPcgCode;
                const currentTargetName = node.type === 'pals_account' ? node.label : parentPcgName;

                if (node.type === 'mapped_account' && node.sourceAccountId && currentTargetId && currentTargetName) {
                    // We extract the pure account name by stripping the `accountId - ` prefix that was added
                    const sourceAccName = node.label.replace(`${node.sourceAccountId} - `, '');
                    
                    payload.push({
                        sourceAccountId: node.sourceAccountId,
                        sourceAccountName: sourceAccName,
                        targetPcgCode: currentTargetId,
                        targetPcgName: currentTargetName
                    });
                }

                if (node.children) {
                    extractMappings(node.children, currentTargetId, currentTargetName);
                }
            });
        };

        extractMappings(treeData);

        try {
            await api.post(`/mapping/${user.companyId}/sync`, {
                mappings: payload,
                triggerEngine: true
            });
            setSaveSuccess(`${payload.length} mapping${payload.length > 1 ? 's' : ''} synchronisé${payload.length > 1 ? 's' : ''} avec succès.`);
        } catch (err) {
            console.error("Sync error:", err);
            setSaveError("Erreur lors de la synchronisation. Vos mappings locaux sont conservés.");
        } finally {
            setIsSaving(false);
        }
    };

    // --- Render Helpers ---

    // Recursive renderer for the Left Pane
    const renderTree = (nodes: TreeNode[], level = 0): React.ReactNode => {
        return nodes.map(node => (
            <DroppableTreeNode
                key={node.id}
                node={node}
                level={level}
                onToggle={handleToggleNode}
                onUnmap={handleUnmap}
                renderChildren={renderTree}
            />
        ));
    };

    // Filtered Right Pane
    const filteredAccounts = unmappedAccounts.filter(acc =>
        acc.accountId.includes(searchQuery) ||
        acc.accountName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="h-full flex flex-col bg-slate-50">
                {/* Header */}
                <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="bg-brand-primary/10 text-brand-primary p-3 rounded-xl border border-brand-primary/20">
                            <MapIcon size={22} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mapping PCG</h1>
                            <p className="text-sm text-slate-500 mt-0.5">
                                Association des comptes de&nbsp;
                                <span className="font-semibold text-slate-700">{user?.companyName || '—'}</span>
                                &nbsp;au plan comptable général.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleSyncClick}
                        disabled={isSaving}
                        className="flex items-center gap-2 bg-brand-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-brand-primary/90 transition-all disabled:opacity-75"
                    >
                        {isSaving ? (
                            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save size={18} />
                        )}
                        Synchroniser
                    </button>
                </header>

                {/* Notifications */}
                {saveSuccess && (
                    <div className="mx-8 mt-4 shrink-0 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-700 font-medium shadow-sm">
                        <CheckCircle2 size={18} className="shrink-0 text-emerald-500" />
                        {saveSuccess}
                    </div>
                )}
                {saveError && (
                    <div className="mx-8 mt-4 shrink-0 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 font-medium shadow-sm">
                        <AlertTriangle size={18} className="shrink-0" />
                        {saveError}
                    </div>
                )}

                <div className="flex-1 flex overflow-hidden p-6 gap-6">

                    {/* LEFT PANE: Target Tree */}
                    <div className="w-2/3 flex flex-col bg-slate-900 rounded-2xl shadow-xl overflow-hidden text-slate-300">
                        <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-400">
                            <span>Target Structure (PCG)</span>
                            <span className="text-brand-primary border border-brand-primary/30 bg-brand-primary/10 px-2 py-0.5 rounded">
                                Valid Drop Zones: Folders & PCG Codes
                            </span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center p-12 text-slate-500">
                                    <Loader2 size={32} className="animate-spin mb-4" />
                                    <p className="text-sm font-medium">Chargement des données...</p>
                                </div>
                            ) : error ? (
                                <div className="bg-red-900/40 text-red-400 border border-red-900 rounded-lg p-4 flex items-center gap-3">
                                    <AlertCircle size={20} />
                                    {error}
                                </div>
                            ) : (
                                renderTree(treeData)
                            )}
                        </div>
                    </div>

                    {/* RIGHT PANE: Unmapped Source */}
                    <div className="w-1/3 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-slate-50">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search by ID or name..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-white rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 border border-slate-200 transition-shadow"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/50">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">
                                Unmapped Source ({filteredAccounts.length})
                            </div>

                            {filteredAccounts.map((account) => (
                                <DraggableAccountItem key={account.accountId} account={account} />
                            ))}

                            {filteredAccounts.length === 0 && (
                                <div className="mt-12 text-center text-slate-400">
                                    <CheckCircle2 size={32} className="mx-auto mb-2 opacity-50 text-emerald-500" />
                                    <p className="font-semibold text-slate-600">All items mapped!</p>
                                    <p className="text-sm">Or no items match your search.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Drag Overlay for smooth visuals while dragging */}
            <DragOverlay>
                {activeAccount ? (
                    <div className="opacity-90 scale-105 rotate-2 shadow-2xl">
                        <DraggableAccountItem account={activeAccount} />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

export default Mapping;
