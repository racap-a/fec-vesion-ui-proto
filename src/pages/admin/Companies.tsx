import { ShieldAlert, Search, Building2, MoreHorizontal } from 'lucide-react';

const COMPANIES_DATA = [
    { id: 1, name: 'MEGACORP', source: 'DB_MEGA_PROD', status: 'Active', lastSync: '2 hrs ago' },
    { id: 2, name: 'ACME_INC', source: 'DB_ACME_V2', status: 'Active', lastSync: '5 mins ago' },
    { id: 3, name: 'GLOBEX', source: 'DB_GLOBEX_LEGACY', status: 'Error', lastSync: '1 day ago' },
];

const Companies = () => {
    return (
        <div className="space-y-6 p-8">
            <header className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h1 className="text-2xl font-bold text-slate-900">Company Management</h1>
                        <span className="bg-red-100 text-red-700 border border-red-200 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                            <ShieldAlert size={10} /> RBAC: Admin Only
                        </span>
                    </div>
                    <p className="text-slate-500">Manage client environments and access controls.</p>
                </div>

            </header>

            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search companies..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
                    />
                </div>
            </div>

            {/* Companies Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4">Company Name</th>
                            <th className="px-6 py-4">SQL Source</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Last Sync</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {COMPANIES_DATA.map((company) => (
                            <tr key={company.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors">
                                        <Building2 size={16} />
                                    </div>
                                    {company.name}
                                </td>
                                <td className="px-6 py-4 text-slate-500 font-mono text-xs">{company.source}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${company.status === 'Active'
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                            : 'bg-rose-50 text-rose-600 border-rose-100'
                                        }`}>
                                        {company.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-500 text-sm">{company.lastSync}</td>
                                <td className="px-6 py-4 text-right">
                                    <button className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors">
                                        <MoreHorizontal size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Companies;
