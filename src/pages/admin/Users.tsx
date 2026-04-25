import { useState, useEffect } from 'react';
import { ShieldAlert, Search, Loader2, X, Mail, CheckCircle, UserCog, AlertTriangle, Plus, UserX, UserCheck } from 'lucide-react';
import api from '../../services/api';

interface User {
    userID: number;
    username: string;
    fullName: string;
    email: string;
    role: string;
    companyId: number | null;
    companyName: string | null;
    isActive: boolean;
    mustChangePassword: boolean;
    lastLogin: string | null;
    createdAt: string;
}

interface Company {
    companyID: number;
    companyName: string;
    companyCode: string;
    isActive: boolean;
}

const EMPTY_ADD = { fullName: '', email: '', role: 'CompanyUser', companyId: '', saving: false, error: '' };

const Users = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [addModal, setAddModal] = useState<{ open: boolean; fullName: string; email: string; role: string; companyId: string; saving: boolean; error: string }>({ open: false, ...EMPTY_ADD });
    const [confirmToggle, setConfirmToggle] = useState<{ open: boolean; user: User | null; toggling: boolean }>({ open: false, user: null, toggling: false });
    const [resendingId, setResendingId] = useState<number | null>(null);
    const [resendStatus, setResendStatus] = useState<Record<number, 'success' | 'error'>>({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [usersRes, companiesRes] = await Promise.all([
                api.get('/auth'),
                api.get('/companies'),
            ]);
            setUsers(usersRes.data);
            setCompanies(companiesRes.data);
        } catch {
            // errors handled by empty state
        } finally {
            setIsLoading(false);
        }
    };

    const addUser = async () => {
        const trimmedName = addModal.fullName.trim();
        const trimmedEmail = addModal.email.trim();
        if (!trimmedName || !trimmedEmail) {
            setAddModal(prev => ({ ...prev, error: 'Nom et email sont requis.' }));
            return;
        }
        if (addModal.role === 'CompanyUser' && !addModal.companyId) {
            setAddModal(prev => ({ ...prev, error: 'Veuillez sélectionner une société.' }));
            return;
        }
        setAddModal(prev => ({ ...prev, saving: true, error: '' }));
        try {
            await api.post('/auth/register', {
                username: trimmedEmail,
                fullName: trimmedName,
                email: trimmedEmail,
                role: addModal.role,
                companyId: addModal.role === 'CompanyUser' ? Number(addModal.companyId) : null,
            });
            await fetchData();
            setAddModal({ open: false, ...EMPTY_ADD });
        } catch (err: any) {
            setAddModal(prev => ({ ...prev, saving: false, error: err.response?.data || 'Échec de la création.' }));
        }
    };

    const confirmAndToggle = async () => {
        if (!confirmToggle.user) return;
        setConfirmToggle(prev => ({ ...prev, toggling: true }));
        try {
            await api.patch(`/auth/${confirmToggle.user.userID}/toggle-status`);
            await fetchData();
            setConfirmToggle({ open: false, user: null, toggling: false });
        } catch {
            setConfirmToggle(prev => ({ ...prev, toggling: false }));
        }
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

    const formatDate = (iso: string | null) => {
        if (!iso) return 'Jamais';
        return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const filtered = users.filter(u =>
        [u.fullName, u.email, u.role, u.companyName ?? ''].some(v =>
            v.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    const activeCompanies = companies.filter(c => c.isActive);

    if (isLoading) return (
        <div className="flex items-center justify-center h-full text-slate-400">
            <Loader2 className="animate-spin mr-2" /> Chargement...
        </div>
    );

    return (
        <div className="space-y-6 p-8">
            {/* Header */}
            <header className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h1 className="text-2xl font-bold text-slate-900">Gestion des utilisateurs</h1>
                        <span className="bg-red-100 text-red-700 border border-red-200 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                            <ShieldAlert size={10} /> Admin Only
                        </span>
                    </div>
                    <p className="text-slate-500">Créez et gérez les accès utilisateurs par société.</p>
                </div>
                <button
                    onClick={() => setAddModal({ open: true, ...EMPTY_ADD })}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-dark text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors"
                >
                    <Plus size={16} />
                    Ajouter un utilisateur
                </button>
            </header>

            {/* Search */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Rechercher par nom, email, rôle, société..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 text-slate-900 bg-white"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4">Utilisateur</th>
                            <th className="px-6 py-4">Rôle</th>
                            <th className="px-6 py-4">Société</th>
                            <th className="px-6 py-4">Statut</th>
                            <th className="px-6 py-4">Dernière connexion</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtered.map(user => (
                            <tr key={user.userID} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold shrink-0">
                                            {user.fullName.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-medium text-slate-900 text-sm">{user.fullName}</div>
                                            <div className="text-xs text-slate-400">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${
                                        user.role === 'Admin'
                                            ? 'bg-blue-50 text-blue-600 border-blue-100'
                                            : 'bg-slate-100 text-slate-600 border-slate-200'
                                    }`}>
                                        {user.role === 'Admin' ? 'Admin' : 'Utilisateur'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">
                                    {user.companyName ?? <span className="text-slate-300">—</span>}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border w-fit ${
                                            user.isActive
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                : 'bg-rose-50 text-rose-600 border-rose-100'
                                        }`}>
                                            {user.isActive ? <><CheckCircle size={10} /> Actif</> : <><UserX size={10} /> Inactif</>}
                                        </span>
                                        {user.mustChangePassword && (
                                            <span className="inline-flex px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 text-xs font-medium w-fit">
                                                En attente
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-500">
                                    {formatDate(user.lastLogin)}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-2">
                                        {user.mustChangePassword && user.isActive && (
                                            resendStatus[user.userID] === 'success' ? (
                                                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                                                    <CheckCircle size={12} /> Envoyé
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => resendWelcomeEmail(user.userID)}
                                                    disabled={resendingId === user.userID}
                                                    title="Renvoyer l'email de bienvenue"
                                                    className="p-1.5 rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-colors disabled:opacity-50"
                                                >
                                                    {resendingId === user.userID ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />}
                                                </button>
                                            )
                                        )}
                                        <button
                                            onClick={() => setConfirmToggle({ open: true, user, toggling: false })}
                                            title={user.isActive ? 'Désactiver' : 'Réactiver'}
                                            className={`p-1.5 rounded-lg transition-colors ${
                                                user.isActive
                                                    ? 'text-slate-400 hover:bg-rose-50 hover:text-rose-600'
                                                    : 'text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'
                                            }`}
                                        >
                                            {user.isActive ? <UserX size={15} /> : <UserCheck size={15} />}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={6} className="text-center py-10 text-slate-400 text-sm">
                                    Aucun utilisateur trouvé.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add User Modal */}
            {addModal.open && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h2 className="text-base font-bold text-slate-900">Ajouter un utilisateur</h2>
                                <p className="text-xs text-slate-400 mt-0.5">Un email de bienvenue sera envoyé automatiquement.</p>
                            </div>
                            <button
                                onClick={() => setAddModal({ open: false, ...EMPTY_ADD })}
                                disabled={addModal.saving}
                                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Nom complet *</label>
                                <input
                                    type="text"
                                    value={addModal.fullName}
                                    onChange={e => setAddModal(prev => ({ ...prev, fullName: e.target.value, error: '' }))}
                                    disabled={addModal.saving}
                                    placeholder="Jean Dupont"
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 text-slate-900 text-sm disabled:opacity-50"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Email *</label>
                                <input
                                    type="email"
                                    value={addModal.email}
                                    onChange={e => setAddModal(prev => ({ ...prev, email: e.target.value, error: '' }))}
                                    disabled={addModal.saving}
                                    placeholder="jean.dupont@societe.com"
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 text-slate-900 text-sm disabled:opacity-50"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Rôle</label>
                                <select
                                    value={addModal.role}
                                    onChange={e => setAddModal(prev => ({ ...prev, role: e.target.value, companyId: '', error: '' }))}
                                    disabled={addModal.saving}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 text-slate-900 text-sm bg-white disabled:opacity-50"
                                >
                                    <option value="CompanyUser">Utilisateur société</option>
                                    <option value="Admin">Administrateur</option>
                                </select>
                            </div>

                            {addModal.role === 'CompanyUser' && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Société *</label>
                                    <select
                                        value={addModal.companyId}
                                        onChange={e => setAddModal(prev => ({ ...prev, companyId: e.target.value, error: '' }))}
                                        disabled={addModal.saving}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 text-slate-900 text-sm bg-white disabled:opacity-50"
                                    >
                                        <option value="">-- Sélectionner une société --</option>
                                        {activeCompanies.map(c => (
                                            <option key={c.companyID} value={c.companyID}>{c.companyName}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {addModal.error && (
                            <p className="mt-3 text-xs text-rose-500">{addModal.error}</p>
                        )}

                        <div className="flex justify-end gap-3 mt-5">
                            <button
                                onClick={() => setAddModal({ open: false, ...EMPTY_ADD })}
                                disabled={addModal.saving}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={addUser}
                                disabled={addModal.saving}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-brand-dark hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {addModal.saving && <Loader2 size={14} className="animate-spin" />}
                                Créer l'utilisateur
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Toggle Modal */}
            {confirmToggle.open && confirmToggle.user && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex items-start gap-4">
                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${confirmToggle.user.isActive ? 'bg-rose-100' : 'bg-emerald-100'}`}>
                                <AlertTriangle size={18} className={confirmToggle.user.isActive ? 'text-rose-600' : 'text-emerald-600'} />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-slate-900 mb-1">
                                    {confirmToggle.user.isActive ? 'Désactiver cet utilisateur ?' : 'Réactiver cet utilisateur ?'}
                                </h2>
                                <p className="text-sm text-slate-500">
                                    {confirmToggle.user.isActive
                                        ? <><span className="font-semibold text-slate-700">{confirmToggle.user.fullName}</span> ne pourra plus se connecter.</>
                                        : <><span className="font-semibold text-slate-700">{confirmToggle.user.fullName}</span> pourra à nouveau se connecter.</>
                                    }
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setConfirmToggle({ open: false, user: null, toggling: false })}
                                disabled={confirmToggle.toggling}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={confirmAndToggle}
                                disabled={confirmToggle.toggling}
                                className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 flex items-center gap-2 ${confirmToggle.user.isActive ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                            >
                                {confirmToggle.toggling && <Loader2 size={14} className="animate-spin" />}
                                {confirmToggle.user.isActive ? 'Désactiver' : 'Réactiver'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
