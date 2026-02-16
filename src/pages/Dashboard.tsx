import { Building2, UploadCloud, Map, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
    const { user } = useAuth();

    return (
        <div className="p-8 bg-slate-50 min-h-screen">
            <header className="mb-12">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome to FECVision</h1>
                <p className="text-slate-500 mt-2">
                    Current Environment: <span className="font-semibold text-slate-900">{user?.companyName || 'No Company Selected'}</span>
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Admin Module */}
                <Link to="/admin/companies" className="group bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <Building2 size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Company Management</h3>
                    <p className="text-slate-500 text-sm">Administer client environments, databases, and access controls.</p>
                </Link>

                {/* Ingestion Module */}
                <Link to="/ingestion" className="group bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <UploadCloud size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">FEC Ingestion</h3>
                    <p className="text-slate-500 text-sm">Upload and process FEC files using the kpiweb154 engine.</p>
                </Link>

                {/* Mapping Module */}
                <Link to="/mapping" className="group bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <Map size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Account Mapping</h3>
                    <p className="text-slate-500 text-sm">Map source accounts to the PCG standard structure.</p>
                </Link>
            </div>

            <div className="mt-12 p-6 bg-slate-900 rounded-2xl text-slate-400 text-sm flex items-start gap-4">
                <ShieldCheck className="shrink-0 text-brand-primary" size={24} />
                <div>
                    <h4 className="font-bold text-white mb-1">System Status</h4>
                    <p>Backend API connected. Engine kpiweb154 is ready for processing.</p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
