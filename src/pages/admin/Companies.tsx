import { useState, useEffect, useRef } from 'react';
import { ShieldAlert, Search, Building2, MoreHorizontal, Loader2, X, Mail, CheckCircle, Users, AlertTriangle, Pencil } from 'lucide-react';
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

interface User {
    userID: number;
    username: string;
    fullName: string;
    email: string;
    role: string;
    companyId: number | null;
    isActive: boolean;
    mustChangePassword: boolean;
    lastLogin: string | null;
    createdAt: string;
}

const Companies = () => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [openDropdown, setOpenDropdown] = useState<number | null>(null);
    const [usersModal, setUsersModal] = useState<{ open: boolean; company: Company | null }>({ open: false, company: null });
    const [users, setUsers] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [resendingId, setResendingId] = useState<number | null>(null);
    const [resendStatus, setResendStatus] = useState<Record<number, 'success' | 'error'>>({});
    const [confirmToggle, setConfirmToggle] = useState<{ open: boolean; company: Company | null; toggling: boolean }>({ open: false, company: null, toggling: false });
    const [editModal, setEditModal] = useState<{ open: boolean; company: Company | null; name: string; saving: boolean; error: string }>({ open: false, company: null, name: '', saving: false, error: '' });
    const dropdownRef = useRef<HTMLDivElement>(null);

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

    const confirmAndToggle = async () => {
        if (!confirmToggle.company) return;
        setConfirmToggle(prev => ({ ...prev, toggling: true }));
        try {
            await api.patch(`/companies/${confirmToggle.company.companyID}/toggle-status`);
            await fetchCompanies();
            setConfirmToggle({ open: false, company: null, toggling: false });
        } catch (err) {
            console.error('Failed to toggle status', err);
            setConfirmToggle(prev => ({ ...prev, toggling: false }));
        }
    };

    const [searchTerm, setSearchTerm] = useState('');

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpenDropdown(null);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const openUsersModal = async (company: Company) => {
        setOpenDropdown(null);
        setUsersModal({ open: true, company });
        setLoadingUsers(true);
        setResendStatus({});
        try {
            const response = await api.get('/auth');
            const companyUsers = (response.data as User[]).filter(u => u.companyId === company.companyID);
            setUsers(companyUsers);
        } catch {
            setUsers([]);
        } finally {
            setLoadingUsers(false);
        }
    };

    const closeUsersModal = () => {
        setUsersModal({ open: false, company: null });
        setUsers([]);
        setResendStatus({});
    };

    const resendWelcomeEmail = async (userId: number) => {
        setResendingId(userId);
        try {
            await api.post(`/auth/${userId}/resend-welcome`);
            setResendStatus(prev => ({ ...prev, [userId]: 'success' }));
        } catch {
            setResendStatus(prev => ({ ...prev, [userId]: 'error' }));
        } finally {
            setResendingId(null);
        }
    };

    const saveCompanyName = async () => {
        if (!editModal.company) return;
        const trimmed = editModal.name.trim();
        if (!trimmed) {
            setEditModal(prev => ({ ...prev, error: 'Le nom ne peut pas être vide.' }));
            return;
        }
        setEditModal(prev => ({ ...prev, saving: true, error: '' }));
        try {
            await api.put(`/companies/${editModal.company.companyID}`, { companyName: trimmed });
            await fetchCompanies();
            setEditModal({ open: false, company: null, name: '', saving: false, error: '' });
        } catch {
            setEditModal(prev => ({ ...prev, saving: false, error: 'Échec de la mise à jour. Veuillez réessayer.' }));
        }
    };

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
                                        onClick={() => setConfirmToggle({ open: true, company, toggling: false })}
                                        className={`px-2.5 py-1 rounded-full text-xs font-medium border cursor-pointer hover:opacity-80 ${company.isActive
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                            : 'bg-rose-50 text-rose-600 border-rose-100'
                                            }`}>
                                        {company.isActive ? 'Active' : 'Inactive'}
                                    </button>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="relative inline-block" ref={openDropdown === company.companyID ? dropdownRef : undefined}>
                                        <button
                                            onClick={() => setOpenDropdown(openDropdown === company.companyID ? null : company.companyID)}
                                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors"
                                        >
                                            <MoreHorizontal size={18} />
                                        </button>
                                        {openDropdown === company.companyID && (
                                            <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-10 py-1">
                                                <button
                                                    onClick={() => openUsersModal(company)}
                                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                                >
                                                    <Users size={14} />
                                                    Voir les utilisateurs
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setOpenDropdown(null);
                                                        setEditModal({ open: true, company, name: company.companyName, saving: false, error: '' });
                                                    }}
                                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                                >
                                                    <Pencil size={14} />
                                                    Modifier le nom
                                                </button>
                                            </div>
                                        )}
                                    </div>
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

            {/* Edit Company Name Modal */}
            {editModal.open && editModal.company && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h2 className="text-base font-bold text-slate-900">Modifier le nom</h2>
                                <p className="text-xs text-slate-400 mt-0.5">Code : <span className="font-mono font-semibold">{editModal.company.companyCode}</span> — non modifiable</p>
                            </div>
                            <button
                                onClick={() => setEditModal({ open: false, company: null, name: '', saving: false, error: '' })}
                                disabled={editModal.saving}
                                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Nom de la société</label>
                        <input
                            type="text"
                            value={editModal.name}
                            onChange={(e) => setEditModal(prev => ({ ...prev, name: e.target.value, error: '' }))}
                            onKeyDown={(e) => e.key === 'Enter' && saveCompanyName()}
                            disabled={editModal.saving}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 text-slate-900 text-sm disabled:opacity-50"
                            autoFocus
                        />

                        {editModal.error && (
                            <p className="mt-2 text-xs text-rose-500">{editModal.error}</p>
                        )}

                        <div className="flex justify-end gap-3 mt-5">
                            <button
                                onClick={() => setEditModal({ open: false, company: null, name: '', saving: false, error: '' })}
                                disabled={editModal.saving}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={saveCompanyName}
                                disabled={editModal.saving || !editModal.name.trim()}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {editModal.saving && <Loader2 size={14} className="animate-spin" />}
                                Enregistrer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toggle Status Confirmation Modal */}
            {confirmToggle.open && confirmToggle.company && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex items-start gap-4">
                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${confirmToggle.company.isActive ? 'bg-rose-100' : 'bg-emerald-100'}`}>
                                <AlertTriangle size={18} className={confirmToggle.company.isActive ? 'text-rose-600' : 'text-emerald-600'} />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-slate-900 mb-1">
                                    {confirmToggle.company.isActive ? 'Désactiver cette société ?' : 'Réactiver cette société ?'}
                                </h2>
                                <p className="text-sm text-slate-500">
                                    {confirmToggle.company.isActive
                                        ? <>Désactiver <span className="font-semibold text-slate-700">{confirmToggle.company.companyName}</span> bloquera immédiatement l'accès à tous ses utilisateurs.</>
                                        : <>Réactiver <span className="font-semibold text-slate-700">{confirmToggle.company.companyName}</span> rétablira l'accès à tous ses utilisateurs.</>
                                    }
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setConfirmToggle({ open: false, company: null, toggling: false })}
                                disabled={confirmToggle.toggling}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={confirmAndToggle}
                                disabled={confirmToggle.toggling}
                                className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 flex items-center gap-2 ${confirmToggle.company.isActive ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                            >
                                {confirmToggle.toggling && <Loader2 size={14} className="animate-spin" />}
                                {confirmToggle.company.isActive ? 'Désactiver' : 'Réactiver'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Users Modal */}
            {usersModal.open && usersModal.company && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Utilisateurs — {usersModal.company.companyName}</h2>
                                <p className="text-xs text-slate-500 mt-0.5">Code: {usersModal.company.companyCode}</p>
                            </div>
                            <button onClick={closeUsersModal} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto px-6 py-4">
                            {loadingUsers ? (
                                <div className="flex items-center justify-center py-10 text-slate-400">
                                    <Loader2 className="animate-spin mr-2" size={18} /> Chargement...
                                </div>
                            ) : users.length === 0 ? (
                                <p className="text-center text-slate-400 py-10 text-sm">Aucun utilisateur pour cette société.</p>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-xs uppercase text-slate-400 border-b border-slate-100">
                                            <th className="pb-3 text-left font-semibold">Utilisateur</th>
                                            <th className="pb-3 text-left font-semibold">Statut</th>
                                            <th className="pb-3 text-right font-semibold">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {users.map(user => (
                                            <tr key={user.userID} className="py-3">
                                                <td className="py-3">
                                                    <div className="font-medium text-slate-900">{user.fullName}</div>
                                                    <div className="text-xs text-slate-400">{user.email}</div>
                                                </td>
                                                <td className="py-3">
                                                    {user.mustChangePassword ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 text-xs font-medium">
                                                            En attente d'activation
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-xs font-medium">
                                                            <CheckCircle size={11} /> Actif
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 text-right">
                                                    {user.mustChangePassword && (
                                                        resendStatus[user.userID] === 'success' ? (
                                                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                                                                <CheckCircle size={13} /> Email envoyé
                                                            </span>
                                                        ) : resendStatus[user.userID] === 'error' ? (
                                                            <span className="text-xs text-rose-500">Échec — réessayer</span>
                                                        ) : (
                                                            <button
                                                                onClick={() => resendWelcomeEmail(user.userID)}
                                                                disabled={resendingId === user.userID}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 text-xs font-medium transition-colors disabled:opacity-50"
                                                            >
                                                                {resendingId === user.userID ? (
                                                                    <Loader2 size={12} className="animate-spin" />
                                                                ) : (
                                                                    <Mail size={12} />
                                                                )}
                                                                Renvoyer l'email
                                                            </button>
                                                        )
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Companies;
