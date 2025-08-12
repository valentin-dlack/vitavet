# Cursor – Rules & Constraints (VitaVet)

## Objectifs Bloc 2 (à ne jamais oublier)
- CI/CD simple mais réel (build + test).
- Qualité: ESLint/Prettier OK, pas d’erreurs.
- Perf: endpoints < 300 ms sur données mock.
- Tests: au moins 1 test unitaire/e2e par US MVP.
- Sécurité: validation DTO, rate-limit, headers (Helmet).
- Accessibilité: a11y de base (labels, contrastes), Lighthouse a11y ≥ 85.
- Docs: mini-readme de la feature + endpoints/API.

## Definition of Ready (DoR)
- US a un identifiant JIRA, un titre clair, critères d’acceptation en 2–3 puces.
- API attendu (verbe + path), données d’entrée/sortie esquissées.

## Definition of Done (DoD)
- Code + test(s) passent en local (`pnpm test` OK).
- Lint & format OK (`pnpm lint`, `pnpm format`).
- Endpoint/documentation vite faite (README feature ou swagger minimal).
- a11y pour UI (labels, focus, pas d’erreur axe).
- Commit et PR contiennent l’ID JIRA.
