import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Building2, UploadCloud, Map, Database, PlusCircle, LogOut, BarChart3, Sparkles, Calculator, UserCog } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth, type User } from '../context/AuthContext';

interface NavItem {
    name: string;
    icon: any;
    href: string;
    roles?: User['role'][];
}

interface NavSection {
    label: string | null;
    items: NavItem[];
    roles?: User['role'][];
}

const NAV_SECTIONS: NavSection[] = [
    {
        label: null,
        items: [
            { name: 'Tableau de bord', icon: LayoutDashboard, href: '/' },
        ],
    },
    {
        label: 'Admin',
        roles: ['Admin'],
        items: [
            { name: 'Sociétés', icon: Building2, href: '/admin/companies', roles: ['Admin'] },
            { name: 'Utilisateurs', icon: UserCog, href: '/admin/users', roles: ['Admin'] },
            { name: 'Créer une société', icon: PlusCircle, href: '/admin/create-company', roles: ['Admin'] },
        ],
    },
    {
        label: 'Opérations',
        items: [
            { name: 'Ingestion FEC', icon: UploadCloud, href: '/ingestion' },
            { name: 'Mapping PCG', icon: Map, href: '/mapping' },
            { name: 'Saisie Extra-Comptable', icon: Calculator, href: '/saisie-extra' },
            { name: 'Validation IA P&L', icon: Sparkles, href: '/ai-pnl-validation' },
        ],
    },
    {
        label: 'Analytics',
        items: [
            { name: 'Compte de Résultat', icon: BarChart3, href: '/pl-dashboard' },
        ],
    },
];

export const Sidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const visibleSections = NAV_SECTIONS
        .filter(section => !section.roles || (user && section.roles.includes(user.role)))
        .map(section => ({
            ...section,
            items: section.items.filter(item => !item.roles || (user && item.roles.includes(user.role))),
        }))
        .filter(section => section.items.length > 0);

    return (
        <aside className="w-64 bg-brand-dark text-white h-screen flex flex-col shrink-0">

            {/* Logo */}
            <div className="px-5 pt-5 pb-4 shrink-0">
                <div className="text-2xl font-black tracking-tight text-white select-none">
                    FEC<span className="text-brand-primary">Vision</span>
                </div>
            </div>

            {/* User badge */}
            <div className="mx-3 mb-4 px-3 py-2.5 bg-slate-800/60 rounded-xl shrink-0">
                <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-0.5">Connecté en tant que</div>
                <div className="text-sm font-semibold text-white truncate">{user?.username || 'Invité'}</div>
                <div className="text-xs text-brand-primary/80 font-medium">{user?.role}</div>
            </div>

            {/* Nav sections */}
            <nav className="flex-1 overflow-y-auto px-3 pb-2 space-y-4">
                {visibleSections.map((section, sIdx) => (
                    <div key={sIdx}>
                        {section.label && (
                            <div className="flex items-center gap-2 px-2 mb-1.5">
                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                                    {section.label}
                                </span>
                                <div className="flex-1 h-px bg-slate-800" />
                            </div>
                        )}
                        <div className="space-y-0.5">
                            {section.items.map(item => (
                                <NavLink
                                    key={item.href}
                                    to={item.href}
                                    end={item.href === '/'}
                                    className={({ isActive }) =>
                                        clsx(
                                            'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 text-sm font-medium border-l-2',
                                            isActive
                                                ? 'border-brand-primary bg-slate-800 text-white'
                                                : 'border-transparent text-slate-400 hover:bg-slate-800/60 hover:text-white'
                                        )
                                    }
                                >
                                    <item.icon size={17} />
                                    <span>{item.name}</span>
                                </NavLink>
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Footer */}
            <div className="px-3 pb-4 pt-2 shrink-0 space-y-2 border-t border-slate-800">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-red-900/20 hover:text-red-400 transition-all duration-150 text-sm font-medium"
                >
                    <LogOut size={17} />
                    <span>Déconnexion</span>
                </button>

                <div className="px-3 py-2 bg-slate-800/50 rounded-xl">
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1.5">
                        <Database size={11} /> Engine
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs text-slate-400 font-mono">kpiweb154.exe v1.2</span>
                    </div>
                </div>
            </div>
        </aside>
    );
};
