// Complète app.json avec les réglages lus dans .env.local (chargé automatiquement par Expo).
// La clé OpenRouter permet à Dobby de répondre librement dans l'écran Messages.
// Sans clé, Dobby répond avec des phrases préparées : l'appli fonctionne quand même.
//
// La clé n'est transmise qu'en développement (npx expo start, Expo Go). Une version publiée
// (npx expo export, mise en ligne sur Cloudflare) ne la contient jamais : en ligne, Dobby passe
// par le Worker Cloudflare (cloudflare/worker.js), qui garde la clé de son côté.
const developpement = process.env.NODE_ENV !== 'production';

module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    openrouterKey: developpement
      ? (process.env.OPENROUTER_API_KEY || process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || '').trim()
      : '',
    openrouterModel: (process.env.OPENROUTER_MODEL || '').trim(),
  },
});
