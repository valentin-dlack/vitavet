import { useState } from 'react';
import { Link } from 'react-router-dom';
import { RegisterForm } from '../components/RegisterForm';

export function Register() {
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSuccess = () => {
    // Redirect to login with success message
    const params = new URLSearchParams();
    params.set('message', 'Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter.');
    window.location.href = `/login?${params.toString()}`;
  };

  const handleError = (errorMessage: string) => {
    setMessage({ type: 'error', text: errorMessage });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          Join VetaVet to manage your pets' health
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {message && (
            <div
              className={`mb-4 p-4 rounded-md ${
                message.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
              role="alert"
            >
              {message.text}
            </div>
          )}

          <RegisterForm onSuccess={handleSuccess} onError={handleError} />

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Already have an account?</span>
              </div>
            </div>

                         <div className="mt-6">
               <Link
                 to="/login"
                 className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
               >
                 Sign in instead
               </Link>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
