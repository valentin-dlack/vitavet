import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
	children: React.ReactNode;
	requiredRole?: string;
	anyOfRoles?: string[];
}

export function ProtectedRoute({ children, requiredRole, anyOfRoles }: ProtectedRouteProps) {
	const { user, isAuthenticated, roles } = useAuth();
	const location = useLocation();

	if (!isAuthenticated) {
		return <Navigate to="/login" state={{ from: location }} replace />;
	}

	const userRoles = [...(roles || []), user?.role].filter(Boolean) as string[];

	if (requiredRole && !userRoles.includes(requiredRole)) {
		return <Navigate to="/unauthorized" replace />;
	}

	if (anyOfRoles && anyOfRoles.length > 0) {
		const ok = userRoles.some(r => anyOfRoles.includes(r));
		if (!ok) return <Navigate to="/unauthorized" replace />;
	}

	return <>{children}</>;
}
