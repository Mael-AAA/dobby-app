// Construit la version web de l'appli dans le dossier dist, pour la mise en ligne sur Cloudflare.
// Lancé par « npm run build:web », et par Cloudflare avant chaque mise en ligne (voir wrangler.jsonc).
// Option : un autre dossier de sortie, par exemple « node scripts/construire-web.mjs ../essai ».
import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const racine = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const sortie = path.resolve(racine, process.argv[2] ?? 'dist');
const lancer = (commande) => execSync(commande, { cwd: racine, stdio: 'inherit' });

// 1. Dépendances : Cloudflare les installe en général de lui-même, sinon on s'en charge ici.
if (!existsSync(path.join(racine, 'node_modules', 'expo', 'package.json'))) lancer('npm ci');

// 2. Version web, en mode production : app.config.js n'y met jamais la clé OpenRouter.
lancer(`npx expo export --platform web --output-dir "${sortie}"`);

// 3. Dernière vérification : aucune clé OpenRouter dans les fichiers publiés.
function fichiers(dossier) {
  return readdirSync(dossier).flatMap((nom) => {
    const chemin = path.join(dossier, nom);
    return statSync(chemin).isDirectory() ? fichiers(chemin) : [chemin];
  });
}
const fautifs = fichiers(sortie).filter((f) => readFileSync(f).includes('sk-or-'));
if (fautifs.length > 0) {
  console.error(`Clé OpenRouter trouvée dans : ${fautifs.map((f) => path.relative(racine, f)).join(', ')}`);
  console.error('Mise en ligne annulée : la clé doit rester un secret du Worker sur Cloudflare.');
  process.exit(1);
}
console.log(`Version web prête dans ${path.relative(racine, sortie) || '.'} (aucune clé dans les fichiers).`);
