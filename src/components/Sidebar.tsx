import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Building2, UploadCloud, Map, Database, PlusCircle, LogIn } from 'lucide-react';
import { clsx } from 'clsx';

const navigation = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/' },
    { name: 'Companies', icon: Building2, href: '/admin/companies' },
    { name: 'Create Company', icon: PlusCircle, href: '/admin/create-company' },
    { name: 'FEC Ingestion', icon: UploadCloud, href: '/ingestion' },
    { name: 'Account Mapping', icon: Map, href: '/mapping' },
    { name: 'Login (Demo)', icon: LogIn, href: '/login' },
];

export const Sidebar = () => (
    <aside className="w-64 bg-brand-dark text-white h-screen p-4 flex flex-col shrink-0">
        <div className="text-2xl font-bold mb-8 px-2 tracking-tight">
            FEC<span className="text-brand-primary">Vision</span>
        </div>
        <nav className="space-y-1">
            {navigation.map((item) => (
                <NavLink
                    key={item.name}
                    to={item.href}
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

        <div className="mt-auto p-2 bg-slate-800/50 rounded-xl">
            <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-widest font-bold px-2 mb-2">
                <Database size={12} /> Engine Status
            </div>
            <div className="flex items-center gap-2 px-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-slate-300 font-mono">kpiweb154.exe (v1.2)</span>
            </div>
        </div>
    </aside>
);
