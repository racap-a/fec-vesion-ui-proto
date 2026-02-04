import { useState } from 'react';
import { Search, ChevronRight, ChevronDown, GripVertical, Save, Folder, FileDigit } from 'lucide-react';
import { clsx } from 'clsx';

// Types for the Tree Structure
type TreeNode = {
    id: string;
    label: string;
    type: 'category' | 'pals_account' | 'mapped_account';
    children?: TreeNode[];
    isOpen?: boolean;
};

// Initial Tree Data (matching the user's request)
const INITIAL_TREE_DATA: TreeNode[] = [
    {
        id: 'charges_var',
        label: 'Charges variables',
        type: 'category',
        isOpen: true,
        children: [
            { id: 'carburants', label: 'Carburants', type: 'category', children: [] },
            { id: 'voyages', label: 'Voyages & Réceptions', type: 'category', children: [] },
        ]
    },
    {
        id: 'couts_fixes',
        label: 'Coûts fixes',
        type: 'category',
        isOpen: true,
        children: [
            {
                id: 'autres_achats',
                label: 'Autres achats, charges externes',
                type: 'category',
                isOpen: true,
                children: [
                    { id: 'assurances', label: 'Assurances', type: 'category', children: [] },
                    {
                        id: 'fournitures',
                        label: 'Fournitures',
                        type: 'category',
                        isOpen: true,
                        children: [
                            {
                                id: '606',
                                label: '606 - Achats non stockés de matières et fournitures',
                                type: 'pals_account',
                                isOpen: true,
                                children: [
                                    { id: '60630000', label: '60630000 - Fourniture entretien /pt équipement', type: 'mapped_account' },
                                    { id: '60640000', label: '60640000 - Fournitures administratives', type: 'mapped_account' },
                                    { id: '60680000', label: '60680000 - Autres matières et fournitures', type: 'mapped_account' }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    }
];

// Unmapped Source Data
const UNMAPPED_FEC = [
    { id: '60650000', name: 'Fournitures informatiques', balance: '1,240.00 €' },
    { id: '60680100', name: 'AIC Autres matières et fournitures', balance: '540.50 €' },
    { id: '62610000', name: 'Frais postaux et télécoms', balance: '150.20 €' },
    { id: '70100000', name: 'Ventes de produits finis', balance: '45,000.00 €' },
];

const Mapping = () => {
    const [treeData, setTreeData] = useState<TreeNode[]>(INITIAL_TREE_DATA);
    const [unmappedItems, setUnmappedItems] = useState(UNMAPPED_FEC);
    const [draggedItem, setDraggedItem] = useState<string | null>(null);

    // Toggle Tree Node Open/Close
    const toggleNode = (nodeId: string) => {
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

    // Handle Drop
    const handleDrop = (targetNodeId: string) => {
        if (!draggedItem) return;

        // Find the item
        const item = unmappedItems.find(i => i.id === draggedItem);
        if (!item) return;

        // Add to tree (Simplified: finding node id match and appending)
        const addToTree = (nodes: TreeNode[]): TreeNode[] => {
            return nodes.map(node => {
                // If this is the target node (must be a pals_account or category to accept children)
                if (node.id === targetNodeId && (node.type === 'pals_account' || node.type === 'category')) {
                    const newItem: TreeNode = {
                        id: item.id,
                        label: `${item.id} - ${item.name}`,
                        type: 'mapped_account'
                    };
                    return { ...node, children: [...(node.children || []), newItem], isOpen: true };
                }
                if (node.children) {
                    return { ...node, children: addToTree(node.children) };
                }
                return node;
            });
        };

        setTreeData(addToTree(treeData));
        setUnmappedItems(unmappedItems.filter(i => i.id !== draggedItem));
        setDraggedItem(null);
    };

    // Recursive Tree Renderer
    const renderTree = (nodes: TreeNode[], level = 0) => {
        return nodes.map(node => (
            <div key={node.id} className="select-none">
                <div
                    className={clsx(
                        "flex items-center gap-2 py-1 px-2 hover:bg-slate-100/10 rounded cursor-pointer transition-colors border border-transparent",
                        level > 0 && "ml-4",
                        node.type === 'pals_account' && "text-blue-200 font-semibold",
                        node.type === 'mapped_account' && "text-slate-400 text-sm ml-6",
                    )}
                    onClick={() => node.children && toggleNode(node.id)}
                    draggable={node.type !== 'mapped_account'}
                    onDragOver={(e) => {
                        if (node.type !== 'mapped_account') e.preventDefault(); // Allow drop
                    }}
                    onDrop={(e) => {
                        e.preventDefault();
                        handleDrop(node.id);
                    }}
                >
                    {/* Icon / Chevron */}
                    <div className="w-4 h-4 flex items-center justify-center shrink-0">
                        {node.children && (
                            node.isOpen ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />
                        )}
                    </div>

                    {/* Node Icon */}
                    {node.type === 'category' && <Folder size={14} className="text-amber-500 fill-amber-500/20" />}
                    {node.type === 'pals_account' && <FileDigit size={14} className="text-blue-400" />}

                    {/* Label */}
                    <span className={clsx(
                        "truncate",
                        node.type === 'mapped_account' && "font-mono text-xs"
                    )}>
                        {node.label}
                    </span>
                </div>

                {/* Children */}
                {node.isOpen && node.children && (
                    <div className="border-l border-slate-700/50 ml-[1.15rem]">
                        {renderTree(node.children, level + 1)}
                    </div>
                )}
            </div>
        ));
    };

    return (
        <div className="h-full flex flex-col bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Mapping Reporting</h1>
                    <p className="text-xs text-slate-500 font-mono">Trigger: -transload do=VIRTUAL</p>
                </div>
                <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-brand-primary/90 transition-all">
                        <Save size={16} /> Sync with Engine
                    </button>
                </div>
            </header>

            {/* Content Swapped: Tree (Left) | Source (Right) */}
            <div className="flex-1 flex overflow-hidden p-6 gap-6">

                {/* LEFT: Target Tree (PCG) */}
                <div className="w-2/3 flex flex-col bg-slate-900 rounded-2xl shadow-xl overflow-hidden text-slate-300">
                    <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-500">
                        <span>Target Structure (PCG)</span>
                        <span>Mapped: {4} Accounts</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        {renderTree(treeData)}
                    </div>
                </div>

                {/* RIGHT: Source Items (Unmapped) */}
                <div className="w-1/3 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search unmapped..."
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/20"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2">
                        <div className="text-[10px] font-bold text-slate-400 uppercase px-3 mb-2 tracking-widest">
                            Unmapped Source ({unmappedItems.length})
                        </div>
                        {unmappedItems.map((item) => (
                            <div
                                key={item.id}
                                draggable
                                onDragStart={() => setDraggedItem(item.id)}
                                onDragEnd={() => setDraggedItem(null)}
                                className={clsx(
                                    "flex items-center justify-between p-3 rounded-xl mb-2 border border-slate-100 shadow-sm cursor-grab active:cursor-grabbing transition-all",
                                    "hover:border-brand-primary/50 hover:bg-brand-primary/5 hover:shadow-md",
                                    draggedItem === item.id && "opacity-50"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="text-slate-400">
                                        <GripVertical size={16} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-800 font-mono">{item.id}</div>
                                        <div className="text-xs text-slate-500 truncate max-w-[140px]">{item.name}</div>
                                    </div>
                                </div>
                                <div className="text-xs font-mono font-medium text-slate-900 bg-slate-100 px-2 py-1 rounded">
                                    {item.balance}
                                </div>
                            </div>
                        ))}

                        {unmappedItems.length === 0 && (
                            <div className="p-8 text-center text-slate-400 text-sm">
                                All items mapped!
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Mapping;
