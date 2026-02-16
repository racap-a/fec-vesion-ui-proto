import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Building2, UploadCloud, Map, Database, PlusCircle, LogOut } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth, type User } from '../context/AuthContext';

// Define navigation items with role restrictions
interface NavItem {
    name: string;
    icon: any;
    href?: string;
    action?: () => void;
    roles?: User['role'][]; // If undefined, accessible by all
}

export const Sidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navigation: NavItem[] = [
        { name: 'Home', icon: LayoutDashboard, href: '/' },
        { name: 'Companies', icon: Building2, href: '/admin/companies', roles: ['Admin'] },
        { name: 'Create Company', icon: PlusCircle, href: '/admin/create-company', roles: ['Admin'] },
        { name: 'FEC Ingestion', icon: UploadCloud, href: '/ingestion' },
        { name: 'Account Mapping', icon: Map, href: '/mapping' },
    ];

    return (
        <aside className="w-64 bg-brand-dark text-white h-screen p-4 flex flex-col shrink-0">
            <div className="text-2xl font-bold mb-8 px-2 tracking-tight">
                FEC<span className="text-brand-primary">Vision</span>
            </div>

            <div className="mb-6 px-2">
                <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Signed in as</div>
                <div className="text-sm font-medium text-white truncate">{user?.username || 'Guest'}</div>
                <div className="text-xs text-brand-primary/80">{user?.role}</div>
            </div>

            <nav className="space-y-1 flex-1">
                {navigation
                    .filter(item => !item.roles || (user && item.roles.includes(user.role)))
                    .map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.href!}
                            className={({ isActive }) =>
                                clsx(
                                    'flex items-center gap-3 p-3 rounded-lg transition-all duration-200',
                                    isActive
                                        ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                )
                            }
                        >
                            <item.icon size={20} />
                            <span className="text-sm font-medium">{item.name}</span>
                        </NavLink>
                    ))}
            </nav>

            <div className="mt-auto space-y-4">
                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 p-3 rounded-lg text-slate-400 hover:bg-red-900/20 hover:text-red-400 transition-all duration-200"
                >
                    <LogOut size={20} />
                    <span className="text-sm font-medium">Sign Out</span>
                </button>

                <div className="p-2 bg-slate-800/50 rounded-xl">
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-widest font-bold px-2 mb-2">
                        <Database size={12} /> Engine Status
                    </div>
                    <div className="flex items-center gap-2 px-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs text-slate-300 font-mono">kpiweb154.exe (v1.2)</span>
                    </div>
                </div>
            </div>
        </aside>
    );
};
