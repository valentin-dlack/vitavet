import { useEffect, useState } from 'react';
import { authService, type User } from '../services/auth.service';

export function useAuth() {
	const [user, setUser] = useState<User | null>(() => authService.getUser());
	const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => authService.isAuthenticated());

	useEffect(() => {
		return authService.onChange(() => {
			setUser(authService.getUser());
			setIsAuthenticated(authService.isAuthenticated());
		});
	}, []);

	return { user, isAuthenticated } as const;
}


