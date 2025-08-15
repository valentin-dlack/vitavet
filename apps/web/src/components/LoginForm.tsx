import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { LoginData } from '../services/auth.service';
import { authService } from '../services/auth.service';

export function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState<LoginData>({ email: '', password: '' });
  const [errors, setErrors] = useState<{ email?: string; password?: string; global?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!form.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validate()) return;

    try {
      setSubmitting(true);
      const result = await authService.login(form);
      authService.setToken(result.token);
      authService.setUser(result.user);

      const state = location.state as { from?: { pathname?: string } } | null;
      const from = state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setErrors({ global: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Login form">
      {errors.global ? (
        <div role="alert" className="text-red-600 mb-4" data-testid="login-error">
          {errors.global}
        </div>
      ) : null}

      <div className="mb-4">
        <label htmlFor="email" className="block font-medium">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
          className="mt-1 block w-full border rounded p-2"
          required
        />
        {errors.email ? (
          <p id="email-error" className="text-red-600 text-sm mt-1">{errors.email}</p>
        ) : null}
      </div>

      <div className="mb-6">
        <label htmlFor="password" className="block font-medium">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? 'password-error' : undefined}
          className="mt-1 block w-full border rounded p-2"
          required
        />
        {errors.password ? (
          <p id="password-error" className="text-red-600 text-sm mt-1">{errors.password}</p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded disabled:opacity-50"
      >
        {submitting ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
