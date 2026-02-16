import { useState, useEffect } from 'react';
import { ShieldAlert, Search, Building2, MoreHorizontal, Loader2 } from 'lucide-react';
import api from '../../services/api';

// Type definition based on API docs
interface Company {
    companyID: number;
    companyName: string;
    companyCode: string;
    databaseName: string;
    isActive: boolean;
    createdAt: string;
}

const Companies = () => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        try {
            const response = await api.get('/companies');
            setCompanies(response.data);
        } catch (err) {
            console.error('Failed to fetch companies', err);
            setError('Failed to load companies. Please ensure you are logged in as Admin.');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleStatus = async (id: number) => {
        try {
            await api.patch(`/companies/${id}/toggle-status`);
            fetchCompanies(); // Refresh list
        } catch (err) {
            console.error('Failed to toggle status', err);
        }
    };

    const [searchTerm, setSearchTerm] = useState('');

    const filteredCompanies = companies.filter(company =>
        (company.companyName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (company.companyCode?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (company.databaseName?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    if (isLoading) return (
        <div className="flex items-center justify-center h-full text-slate-400">
            <Loader2 className="animate-spin mr-2" /> Loading companies...
        </div>
    );

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

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100 text-sm">
                    {error}
                </div>
            )}

            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search companies..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all text-slate-900 bg-white"
                    />
                </div>
            </div>

            {/* Companies Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4">Company Name</th>
                            <th className="px-6 py-4">Code / Database</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredCompanies.map((company) => (
                            <tr key={company.companyID} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors">
                                        <Building2 size={16} />
                                    </div>
                                    {company.companyName}
                                </td>
                                <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                                    <span className="block text-slate-700 font-bold">{company.companyCode}</span>
                                    {company.databaseName}
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => toggleStatus(company.companyID)}
                                        className={`px-2.5 py-1 rounded-full text-xs font-medium border cursor-pointer hover:opacity-80 ${company.isActive
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                            : 'bg-rose-50 text-rose-600 border-rose-100'
                                            }`}>
                                        {company.isActive ? 'Active' : 'Inactive'}
                                    </button>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors">
                                        <MoreHorizontal size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {companies.length === 0 && !error && (
                            <tr>
                                <td colSpan={5} className="text-center py-8 text-slate-400">No companies found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Companies;
