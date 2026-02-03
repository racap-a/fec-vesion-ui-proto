import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

const Layout = () => {
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
                        <select className="bg-slate-50 border border-slate-200 rounded text-sm font-semibold px-2 py-1 text-slate-700 hover:border-slate-300 transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-brand-primary/10">
                            <option>MEGACORP</option>
                            <option>ACME_INC</option>
                        </select>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary text-xs font-bold">
                        JD
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
