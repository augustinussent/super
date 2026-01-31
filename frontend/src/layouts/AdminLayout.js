import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Mail,
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
  List,
  TrendingUp
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

  // State for expanded nested menus
  const [expandedMenus, setExpandedMenus] = useState({});

  const toggleMenu = (name) => {
    setExpandedMenus(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const allMenuItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, permKey: 'dashboard' },
    { name: 'Analytics', path: '/admin/analytics', icon: TrendingUp, permKey: 'dashboard' },
    {
      name: 'Kelola Kamar',
      icon: BedDouble,
      permKey: 'rooms',
      children: [
        { name: 'Daftar Kamar', path: '/admin/rooms', permKey: 'rooms' },
        { name: 'Rate Plans', path: '/admin/rate-plans', permKey: 'rooms' },
      ]
    },
    { name: 'Reservasi', path: '/admin/reservations', icon: CalendarCheck, permKey: 'reservations' },
    { name: 'Pengguna', path: '/admin/users', icon: Users, permKey: 'users' },
    { name: 'Kode Promo', path: '/admin/promo-codes', icon: Tag, permKey: 'promo' },
    { name: 'Review', path: '/admin/reviews', icon: Star, permKey: 'reviews' },
    { name: 'Konten', path: '/admin/content', icon: FileText, permKey: 'content' },
    { name: 'Template Email', path: '/admin/email-templates', icon: Mail, permKey: 'email_config' },
    { name: 'Media Optimizer', path: '/admin/media-converter', icon: Image, permKey: 'content' },
    { name: 'Activity Logs', path: '/admin/logs', icon: Shield, permKey: 'logs' },
  ];

  // Filter menu items based on user permissions
  const menuItems = allMenuItems.filter(item => hasPermission(item.permKey));

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // ... (loading and auth checks remain same) ...

  const NavItem = ({ item, isChild = false }) => {
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus[item.name];

    // Check if any child is active to highlight parent
    const isChildActive = hasChildren && item.children.some(child => location.pathname === child.path);
    const isActive = location.pathname === item.path || isChildActive;

    if (hasChildren) {
      return (
        <div className="space-y-1">
          <button
            onClick={() => {
              if (!isSidebarOpen) setIsSidebarOpen(true);
              toggleMenu(item.name);
            }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${isActive || isExpanded ? 'text-white bg-emerald-800' : 'text-emerald-200 hover:bg-emerald-800'
              }`}
          >
            <div className={`flex items-center space-x-3 ${!isSidebarOpen && 'justify-center w-full'}`}>
              <Icon className="w-5 h-5 flex-shrink-0" />
              {isSidebarOpen && <span className="font-medium whitespace-nowrap">{item.name}</span>}
            </div>
            {isSidebarOpen && (
              <ChevronRight
                className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
              />
            )}
          </button>

          {/* Render Children */}
          {isExpanded && isSidebarOpen && (
            <div className="pl-12 space-y-1">
              {item.children.map(child => (
                <Link
                  key={child.path}
                  to={child.path}
                  className={`block py-2 text-sm transition-colors ${location.pathname === child.path
                    ? 'text-white font-medium'
                    : 'text-emerald-300 hover:text-white'
                    }`}
                >
                  {child.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        to={item.path}
        data-testid={`admin-nav-${item.name.toLowerCase().replace(' ', '-')}`}
        className={`flex items-center space-x-3 py-3 rounded-lg transition-colors ${isSidebarOpen ? 'px-4' : 'justify-center px-2'
          } ${isActive
            ? 'bg-emerald-600 text-white'
            : 'text-emerald-200 hover:bg-emerald-800'
          }`}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        {isSidebarOpen && <span className="font-medium whitespace-nowrap">{item.name}</span>}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ... (Overlay and Aside Header remain same) ... */}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-emerald-950 text-white z-50 transition-all duration-300 flex flex-col ${isSidebarOpen ? 'w-64' : 'w-20'
          } ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-emerald-800 flex-shrink-0">
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
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <NavItem key={item.name} item={item} />
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-emerald-800 flex-shrink-0">
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
