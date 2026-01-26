import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * PermissionGuard - Protects admin routes based on user permissions
 * Redirects to /admin if user doesn't have the required permission
 */
const PermissionGuard = ({ permKey, children }) => {
    const { hasPermission, loading, user } = useAuth();

    // Show loading state while checking auth
    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
            </div>
        );
    }

    // If user doesn't have permission, redirect to admin dashboard
    if (!hasPermission(permKey)) {
        return <Navigate to="/admin" replace />;
    }

    return children;
};

export default PermissionGuard;
