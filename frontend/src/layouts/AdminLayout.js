import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BedDouble,
  CalendarCheck,
  Users,
  Tag,
  Star,
  FileText,
  Menu,
  X,
  LogOut,
  ChevronRight,
  Settings,
  Shield,
  Image,
  List
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, loading, hasAnyAdminAccess, hasPermission } = useAuth();

  useEffect(() => {
    if (!loading && (!user || !hasAnyAdminAccess())) {
      navigate('/login');
    }
  }, [user, loading, hasAnyAdminAccess, navigate]);

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location]);

  const allMenuItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, permKey: 'dashboard' },
    { name: 'Kelola Kamar', path: '/admin/rooms', icon: BedDouble, permKey: 'rooms' },
    { name: 'Reservasi', path: '/admin/reservations', icon: CalendarCheck, permKey: 'reservations' },
    { name: 'Pengguna', path: '/admin/users', icon: Users, permKey: 'users' },
    { name: 'Kode Promo', path: '/admin/promo-codes', icon: Tag, permKey: 'promo' },
    { name: 'Rate Plans', path: '/admin/rate-plans', icon: List, permKey: 'rooms' },
    { name: 'Review', path: '/admin/reviews', icon: Star, permKey: 'reviews' },
    { name: 'Konten', path: '/admin/content', icon: FileText, permKey: 'content' },
    { name: 'Media Optimizer', path: '/admin/media-converter', icon: Image, permKey: 'content' },
    // { name: 'Pengaturan', path: '/admin/settings', icon: Settings, permKey: 'settings' },
    { name: 'Activity Logs', path: '/admin/logs', icon: Shield, permKey: 'logs' },
  ];

  // Filter menu items based on user permissions
  const menuItems = allMenuItems.filter(item => hasPermission(item.permKey));

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user || !hasAnyAdminAccess()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-emerald-950 text-white z-50 transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'
          } ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-emerald-800">
          {isSidebarOpen && (
            <span className="font-display text-xl font-bold">Spencer Green</span>
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="hidden lg:block p-2 hover:bg-emerald-800 rounded-lg transition-colors"
            data-testid="toggle-sidebar"
          >
            <ChevronRight className={`w-5 h-5 transition-transform ${isSidebarOpen ? 'rotate-180' : ''}`} />
          </button>
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-emerald-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                data-testid={`admin-nav-${item.name.toLowerCase().replace(' ', '-')}`}
                className={`flex items-center space-x-3 py-3 rounded-lg transition-colors ${isSidebarOpen ? 'px-4' : 'justify-center px-2'} ${isActive
                  ? 'bg-emerald-600 text-white'
                  : 'text-emerald-200 hover:bg-emerald-800'
                  }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {isSidebarOpen && <span className="font-medium whitespace-nowrap">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-emerald-800">
          <button
            onClick={handleLogout}
            data-testid="logout-button"
            className="flex items-center space-x-3 px-4 py-3 w-full text-emerald-200 hover:bg-emerald-800 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {isSidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        {/* Top Bar */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-4 lg:px-8">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            data-testid="mobile-menu-button"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>

          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Welcome,</span>
            <span className="font-semibold text-gray-800">{user?.name}</span>
          </div>

          <Link
            to="/"
            className="text-emerald-600 hover:text-emerald-700 font-medium"
            data-testid="view-site-link"
          >
            View Site
          </Link>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
