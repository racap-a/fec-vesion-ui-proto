import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

import { useAuth } from '../context/AuthContext';

const Layout = () => {
    const { user } = useAuth();

    // Get initials from Full Name or Username
    const getInitials = () => {
        if (user?.fullName) {
            return user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        }
        return user?.username?.substring(0, 2).toUpperCase() || 'GU';
    };

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* Sidebar - Fixed width */}
            <Sidebar />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Optional Top Bar for Global Actions/User Profile */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 shadow-sm z-10">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-500">Workspace:</span>
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded px-3 py-1.5 min-w-[150px]">
                            <div className={`w-2 h-2 rounded-full ${user?.role === 'Admin' ? 'bg-purple-500' : 'bg-emerald-500'}`} />
                            <span className="text-sm font-semibold text-slate-700">
                                {user?.role === 'Admin' ? 'Global Admin' : (user?.companyName || 'Unknown Company')}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right hidden md:block">
                            <div className="text-sm font-bold text-slate-900">{user?.fullName || user?.username}</div>
                            <div className="text-xs text-slate-500">{user?.role}</div>
                        </div>
                        <div className="h-9 w-9 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary text-sm font-bold">
                            {getInitials()}
                        </div>
                    </div>
                </header>

                {/* Page Content - Scrollable */}
                <div className="flex-1 overflow-y-auto bg-slate-50 scroll-smooth">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
