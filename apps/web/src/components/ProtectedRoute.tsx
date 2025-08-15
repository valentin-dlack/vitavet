import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
	children: ReactNode;
	requiredRole?: string;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
	const { user, isAuthenticated } = useAuth();
	const location = useLocation();

	if (!isAuthenticated) {
		// Redirect to login page with return URL
		return <Navigate to="/login" state={{ from: location }} replace />;
	}

	if (requiredRole && user?.role !== requiredRole) {
		// Redirect to unauthorized page
		return <Navigate to="/unauthorized" replace />;
	}

	return <>{children}</>;
}
