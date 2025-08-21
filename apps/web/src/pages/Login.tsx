import { Link, useSearchParams } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';

export function Login() {
  const [searchParams] = useSearchParams();
  const message = searchParams.get('message');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-extrabold text-gray-900">
          Se connecter
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          Connectez-vous à votre compte VitaVet
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10" role="region" aria-label="Login">
          {message && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-800 rounded-md" role="alert">
              {message}
            </div>
          )}
          <LoginForm />

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Pas encore de compte ?{' '}
              <Link to="/register" className="text-blue-600 hover:text-blue-500">
                Créer un compte
              </Link>
            </p>
            <p className="text-sm text-gray-600 mt-2">
              <Link to="/" className="text-blue-600 hover:text-blue-500">
                ← Retour à l'accueil
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
