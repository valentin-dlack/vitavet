import { useEffect, useState } from 'react';
import { authService, type User } from '../services/auth.service';

export function useAuth() {
	const [user, setUser] = useState<User | null>(() => authService.getUser());
	const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => authService.isAuthenticated());
	const [roles, setRoles] = useState<string[]>(() => authService.getUserRoles());

	useEffect(() => {
		return authService.onChange(() => {
			setUser(authService.getUser());
			setIsAuthenticated(authService.isAuthenticated());
			setRoles(authService.getUserRoles());
		});
	}, []);

	return { user, isAuthenticated, roles } as const;
}


