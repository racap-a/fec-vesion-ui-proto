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
            <div className="px-5 pt-6 pb-4 shrink-0">
                <svg viewBox="0 0 444.48 96.68" className="h-9 w-auto" aria-label="FECVision" role="img">
                    <g>
                        <path fill="#ffffff" d="M52.9,12.12v9.12H20.51v23.06h25.68v9.12h-25.68v30.92h-9.75V12.12h42.14Z"/>
                        <path fill="#ffffff" d="M108.66,12.12v9.12h-33.02v23.06h28.83v9.12h-28.83v21.8h34.07v9.12h-43.82V12.12h42.77Z"/>
                        <path fill="#ffffff" d="M182.78,72.92c-6.39,7.65-16.04,12.47-27.36,12.47-20.44,0-36.58-16.46-36.58-37s16.14-37.11,36.58-37.11c11.22,0,20.76,4.72,27.15,12.27l-7.34,6.08c-4.93-5.35-11.85-8.91-19.81-8.91-15.2,0-26.84,12.27-26.84,27.67s11.64,27.57,26.84,27.57c8.07,0,15.09-3.46,20.02-9.22l7.34,6.19Z"/>
                        <path fill="#ffffff" d="M229.84,35.39h5.14l-20.65,48.96h-5.56l-20.55-48.96h5.14l18.14,43.61,18.34-43.61Z"/>
                        <path fill="#ffffff" d="M248.92,13.38c2.41,0,4.09,1.68,4.09,3.88s-1.68,3.88-4.09,3.88-4.19-1.68-4.19-3.88,1.78-3.88,4.19-3.88ZM251.33,35.39v48.96h-4.72v-48.96h4.72Z"/>
                        <path fill="#ffffff" d="M297.56,46.61h-4.72c-.84-4.72-5.03-7.65-10.38-7.65s-10.06,2.94-10.8,7.13c-.84,6.81,4.4,9.22,8.49,10.06l7.02,1.68c8.91,2.2,12.05,7.34,12.05,13.52,0,8.39-7.02,14.05-17.19,14.05-7.97,0-16.04-4.72-17.19-13.52h4.4c1.36,3.88,4.4,8.91,13.1,8.91,7.55,0,12.16-3.67,12.16-9.43,0-3.88-2.1-7.34-8.39-8.91l-7.13-1.68c-5.87-1.36-13.21-4.3-12.06-15.31.84-6.71,7.86-11.11,15.51-11.11s14.15,4.19,15.1,12.26Z"/>
                        <path fill="#ffffff" d="M315.48,13.38c2.41,0,4.09,1.68,4.09,3.88s-1.68,3.88-4.09,3.88-4.19-1.68-4.19-3.88,1.78-3.88,4.19-3.88ZM317.89,35.39v48.96h-4.72v-48.96h4.72Z"/>
                        <path fill="#ffffff" d="M392.1,35.39h4.82v9.64c2.83-7.86,10.59-10.69,17.3-10.69,11.74,0,19.5,8.18,19.5,21.28v28.72h-4.72v-28.72c0-10.38-5.98-16.56-14.78-16.56s-16.98,4.82-17.3,17.82v27.46h-4.82v-48.96Z"/>
                    </g>
                    <g>
                        <path fill="#ffffff" d="M354.75,80.48c-11.8,0-21.74-8.63-21.74-21.85,0-11.31,7.39-19.13,17-21.06l-.11-4.99c-12.28,2.02-21.81,11.72-21.81,26.05,0,16.17,12.13,26.77,26.66,26.77,13.45,0,24.84-9.08,26.45-23.26l-5.04.56c-1.81,10.89-10.87,17.78-21.41,17.78Z"/>
                        <path fill="#f4c868" d="M353,37.17l-.11-4.93s14.28-1.63,23,9.68c0,0,6.41,8.73,5.51,17.19l-4.94.55s1.29-23.02-23.46-22.49Z"/>
                    </g>
                </svg>
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
