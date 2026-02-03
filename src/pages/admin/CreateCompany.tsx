import { Building2, Database, FolderPlus } from 'lucide-react';

const CreateCompany = () => {
    return (
        <div className="space-y-6 p-8">
            <header>
                <h1 className="text-2xl font-bold text-slate-900">Create New Company</h1>
                <p className="text-slate-500">Register new client environments for processing.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Registration Form */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                        <Building2 size={20} className="text-brand-primary" />
                        New Entity Details
                    </h2>

                    <form className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="e.g. MEGACORP"
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                                />
                                <Building2 className="absolute left-3 top-2.5 text-slate-400" size={18} />
                            </div>
                            <p className="text-xs text-slate-400 mt-1">This will create folder: <span className="font-mono">\xxx\MEGACORP</span></p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">SQL Source</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Database Name"
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                                />
                                <Database className="absolute left-3 top-2.5 text-slate-400" size={18} />
                            </div>
                            <p className="text-xs text-slate-400 mt-1">Engine action: <span className="font-mono">-spe do=CREXPINS</span></p>
                        </div>

                        <div className="pt-4">
                            <button type="submit" className="w-full bg-brand-dark text-white py-2.5 rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                                <FolderPlus size={18} />
                                Provision Environment
                            </button>
                        </div>
                    </form>
                </div>

                {/* Info / Preview Panel */}
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Provisioning Preview</h3>

                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-brand-primary flex items-center justify-center shrink-0">
                                <span className="font-bold text-sm">1</span>
                            </div>
                            <div>
                                <p className="font-medium text-slate-900">Folder Structure</p>
                                <p className="text-sm text-slate-500 mt-1">Root directory creation and subfolder initialization for artifacts.</p>
                                <div className="mt-2 text-xs font-mono bg-slate-100 p-2 rounded text-slate-600 border border-slate-200">
                                    \Data\Clients\NEW_COMPANY\<br />
                                    ├── Inbound<br />
                                    ├── Processed<br />
                                    └── Errors
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-brand-primary flex items-center justify-center shrink-0">
                                <span className="font-bold text-sm">2</span>
                            </div>
                            <div>
                                <p className="font-medium text-slate-900">Database Schema</p>
                                <p className="text-sm text-slate-500 mt-1">Execution of <span className="font-mono">-spe do=CREXPINS</span> to bootstrap client schema.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateCompany;
