import { Link } from "react-router-dom";
import { HealthCheck } from "../components/HealthCheck";
import { useAuth } from "../hooks/useAuth";
import intro from "../assets/intro.png";

export function Home() {
  const { isAuthenticated, user } = useAuth();
  const displayName = user ? `${user.firstName} ${user.lastName}` : "";

  return (
    <div className="bg-white">
      {/* Run health check but do not render anything */}
      <HealthCheck />

      {/* Hero section */}
      <section className="relative isolate pt-16">
        <div className="mx-auto max-w-5xl px-4 py-20">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900">
                Simplifiez la gestion de votre clinique vétérinaire
              </h1>
              <p className="mt-4 text-lg text-gray-600">
                VitaVet centralise les rendez-vous, les dossiers patients, les rappels et la
                communication avec les propriétaires, pour un cabinet plus efficace et des animaux mieux suivis.
              </p>
              <div className="mt-8 flex items-center gap-3">
                {isAuthenticated ? (
                  <>
                    <Link to="/panel" className="inline-flex items-center rounded bg-blue-600 px-5 py-3 text-white hover:bg-blue-700">
                      Accéder au panel
                    </Link>
                    <span className="text-sm text-gray-600">Bienvenue {displayName} 👋</span>
                  </>
                ) : (
                  <>
                    <Link to="/register" className="inline-flex items-center rounded bg-blue-600 px-5 py-3 text-white hover:bg-blue-700">
                      Commencer gratuitement
                    </Link>
                    <Link to="/clinics" className="inline-flex items-center rounded border px-5 py-3 text-gray-700 hover:bg-gray-50">
                      Trouver une clinique
                    </Link>
                  </>
                )}
              </div>
            </div>
            <div className="relative">
              <img src={intro} alt="Aperçu VitaVet" className="w-full rounded-xl border shadow-sm" />
            </div>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section className="border-t bg-gray-50">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="text-2xl font-bold text-gray-900">Tout ce qu’il faut pour votre équipe</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="text-blue-600 text-2xl">📅</div>
              <h3 className="mt-3 font-semibold text-gray-900">Agenda intelligent</h3>
              <p className="mt-2 text-sm text-gray-600">Créneaux optimisés, gestion des disponibilités et prise de rendez-vous en ligne.</p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="text-blue-600 text-2xl">📁</div>
              <h3 className="mt-3 font-semibold text-gray-900">Dossiers patients</h3>
              <p className="mt-2 text-sm text-gray-600">Historique complet, documents et suivi des traitements en un seul endroit.</p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="text-blue-600 text-2xl">🔔</div>
              <h3 className="mt-3 font-semibold text-gray-900">Rappels automatiques</h3>
              <p className="mt-2 text-sm text-gray-600">Notifications pour vaccins, traitements et visites de contrôle.</p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="text-blue-600 text-2xl">👤</div>
              <h3 className="mt-3 font-semibold text-gray-900">Espace propriétaire</h3>
              <p className="mt-2 text-sm text-gray-600">Portail simple pour gérer animaux, documents et rendez-vous.</p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="text-blue-600 text-2xl">🏥</div>
              <h3 className="mt-3 font-semibold text-gray-900">Multi-cliniques</h3>
              <p className="mt-2 text-sm text-gray-600">Gérez plusieurs sites, rôles et équipes en toute sécurité.</p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="text-blue-600 text-2xl">🛡️</div>
              <h3 className="mt-3 font-semibold text-gray-900">Sécurité et RGPD</h3>
              <p className="mt-2 text-sm text-gray-600">Authentification sécurisée et respect des meilleures pratiques.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section>
        <div className="mx-auto max-w-5xl px-4 py-16">
          <div className="rounded-xl bg-blue-600 p-8 md:p-12 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold">Prêt à essayer VitaVet ?</h3>
              <p className="mt-2 opacity-90">Inscrivez-vous en 2 minutes et commencez à organiser votre activité.</p>
            </div>
            <div className="flex gap-3">
              {isAuthenticated ? (
                <Link to="/panel" className="inline-flex items-center rounded bg-white px-5 py-3 text-blue-700 hover:bg-blue-50">
                  Ouvrir le panel
                </Link>
              ) : (
                <>
                  <Link to="/register" className="inline-flex items-center rounded bg-white px-5 py-3 text-blue-700 hover:bg-blue-50">
                    Créer un compte
                  </Link>
                  <Link to="/login" className="inline-flex items-center rounded border border-white/40 px-5 py-3 text-white hover:bg-white/10">
                    Se connecter
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer section */}
      <footer className="border-t bg-gray-900 text-gray-300">
        <div className="mx-auto max-w-5xl px-4 py-12">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-white font-semibold">VitaVet</div>
              <p className="mt-2 text-sm text-gray-400 max-w-sm">
                Solution moderne pour la gestion des cliniques vétérinaires et le suivi des patients.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
              <div>
                <div className="text-sm font-semibold text-white">Produit</div>
                <ul className="mt-3 space-y-2 text-sm">
                  <li><Link to="/clinics" className="hover:text-white">Cliniques</Link></li>
                  <li><Link to="/vet/agenda" className="hover:text-white">Agenda</Link></li>
                  <li><Link to="/vet/reminders" className="hover:text-white">Rappels</Link></li>
                </ul>
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Compte</div>
                <ul className="mt-3 space-y-2 text-sm">
                  {isAuthenticated ? (
                    <>
                      <li><Link to="/profile" className="hover:text-white">Profil</Link></li>
                      <li><Link to="/panel" className="hover:text-white">Panel</Link></li>
                    </>
                  ) : (
                    <>
                      <li><Link to="/login" className="hover:text-white">Se connecter</Link></li>
                      <li><Link to="/register" className="hover:text-white">S’inscrire</Link></li>
                    </>
                  )}
                </ul>
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Ressources</div>
                <ul className="mt-3 space-y-2 text-sm">
                  <li><a className="hover:text-white" href="#main-content">Accessibilité</a></li>
                  <li><a className="hover:text-white" href="https://github.com/" target="_blank" rel="noreferrer">GitHub</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-10 border-t border-white/10 pt-6 text-xs text-gray-400 flex items-center justify-between">
            <span>© {new Date().getFullYear()} VitaVet. Tous droits réservés.</span>
            <span>Fait avec amour pour les animaux</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
