import { Search, ChevronRight, GripVertical, AlertCircle, Save } from 'lucide-react';

// Mock Data representing the result of F3 (Process Data)
const UNMAPPED_FEC = [
    { id: '601100', name: 'Achats de matières premières', balance: '12,450.00 €' },
    { id: '626100', name: 'Frais postaux', balance: '150.20 €' },
    { id: '701000', name: 'Ventes de produits finis', balance: '45,000.00 €' },
];

const PCG_STRUCTURE = [
    { code: '6', name: 'Charges', accounts: [] },
    { code: '7', name: 'Produits', accounts: ['701000'] },
];

const Mapping = () => {
    // const [activeTab, setActiveTab] = useState('unmapped');

    return (
        <div className="h-full flex flex-col bg-slate-50">
            {/* Workspace Header */}
            <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Mapping Reporting</h1>
                    <p className="text-xs text-slate-500 font-mono">Trigger: -transload do=VIRTUAL</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <div className="text-xs text-slate-500 font-medium mb-1">Mapping Progress</div>
                        <div className="w-48 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                            <div className="h-full bg-emerald-500 w-2/3" />
                        </div>
                    </div>
                    <button className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-brand-primary/90 transition-all">
                        <Save size={16} /> Sync with Engine
                    </button>
                </div>
            </header>

            {/* Main Workspace */}
            <div className="flex-1 flex overflow-hidden p-6 gap-6">

                {/* Left Panel: FEC Source (The "Input") */}
                <div className="w-1/2 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search FEC accounts..."
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/20"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2">
                        <div className="text-[10px] font-bold text-slate-400 uppercase px-3 mb-2 tracking-widest">
                            Unmapped Entries ({UNMAPPED_FEC.length})
                        </div>
                        {UNMAPPED_FEC.map((acc) => (
                            <div key={acc.id} className="group flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 cursor-grab border border-transparent hover:border-slate-200 transition-all mb-1">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-100 rounded text-slate-400 group-hover:text-brand-primary transition-colors">
                                        <GripVertical size={16} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-700">{acc.id}</div>
                                        <div className="text-xs text-slate-500">{acc.name}</div>
                                    </div>
                                </div>
                                <div className="text-sm font-mono font-medium text-slate-900">{acc.balance}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Panel: PCG Destination (The "Standard") */}
                <div className="w-1/2 flex flex-col bg-slate-900 rounded-2xl shadow-xl overflow-hidden">
                    <div className="p-4 bg-slate-800/50 border-b border-slate-700">
                        <h3 className="text-white font-bold text-sm">Target PCG Structure</h3>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {PCG_STRUCTURE.map((folder) => (
                            <div key={folder.code} className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 transition-all hover:bg-slate-800/60">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <ChevronRight size={16} className="text-slate-500" />
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Classe {folder.code}</span>
                                        <span className="text-sm font-bold text-white">{folder.name}</span>
                                    </div>
                                    <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-bold uppercase">
                                        {folder.accounts.length} mapped
                                    </span>
                                </div>

                                {/* Drop Zone Placeholder */}
                                <div className="border-2 border-dashed border-slate-700 rounded-lg p-4 flex flex-col items-center justify-center gap-2 hover:border-brand-primary/50 transition-colors group">
                                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-brand-primary">
                                        <AlertCircle size={16} />
                                    </div>
                                    <span className="text-[10px] text-slate-500 font-medium">Drop FEC accounts here to classify</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Mapping;
