import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
	children: ReactNode;
	requiredRole?: string;
	anyOfRoles?: string[];
}

export function ProtectedRoute({ children, requiredRole, anyOfRoles }: ProtectedRouteProps) {
	const { user, isAuthenticated } = useAuth();
	const location = useLocation();

	if (!isAuthenticated) {
		// Redirect to login page with return URL
		return <Navigate to="/login" state={{ from: location }} replace />;
	}

	// If a single requiredRole is provided, enforce it
	if (requiredRole && user?.role !== requiredRole) {
		// Redirect to unauthorized page
		return <Navigate to="/unauthorized" replace />;
	}

	// If anyOfRoles is provided, allow if user has one of them
	if (anyOfRoles && anyOfRoles.length > 0) {
		const roles = [user?.role].filter(Boolean) as string[];
		const ok = roles.some(r => anyOfRoles.includes(r));
		if (!ok) return <Navigate to="/unauthorized" replace />;
	}

	return <>{children}</>;
}
