// Réglages de Metro, l'outil d'Expo qui prépare le code pour Expo Go.
const crypto = require('node:crypto');
const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// La version web garde en cache les réglages lus dans .env.local (clé, modèle). Quand ils changent,
// Metro repart d'un cache neuf au démarrage suivant : plus besoin de « npx expo start --clear ».
const reglages = `${process.env.OPENROUTER_API_KEY ?? ''}|${process.env.OPENROUTER_MODEL ?? ''}`;
config.cacheVersion = `${config.cacheVersion ?? '1'}-${crypto.createHash('sha256').update(reglages).digest('hex').slice(0, 12)}`;

/** Dossier du projet -> motif qui reconnaît tout ce qu'il contient (séparateur / ou \, lecteur C: ou c:) */
function dossier(nom) {
  const morceaux = path
    .join(__dirname, nom)
    .split(/[\\/]/)
    .map((m) =>
      /^[a-z]:$/i.test(m)
        ? `[${m[0].toUpperCase()}${m[0].toLowerCase()}]:`
        : m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    );
  return new RegExp(`^${morceaux.join('[\\\\/]')}(?:[\\\\/].*)?$`);
}

// La version web (dist) et les fichiers locaux de Cloudflare (.wrangler) ne font pas partie de l'appli.
// Metro ne les surveille pas : les produire ne fait pas recharger Expo Go (bandeau bleu « Refreshing... »).
config.resolver.blockList = [...[config.resolver.blockList].flat().filter(Boolean), dossier('dist'), dossier('.wrangler')];

module.exports = config;
