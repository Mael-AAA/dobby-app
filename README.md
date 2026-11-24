# Application Dobby

L'application qui accompagne Dobby : suivre ce qu'il fait, lui confier une tâche, l'arrêter, fermer des pièces, valider les achats.
Expo (SDK 58) et Expo Router, en thème clair, avec les couleurs et le logo du site.

## Lancer l'appli sur votre téléphone (Expo Go)

1. Installez **Expo Go** sur le téléphone (App Store ou Google Play).
2. Le téléphone et l'ordinateur doivent être sur le **même réseau Wi-Fi**.
3. Dans un terminal :

```bash
cd dobby-app
npm install      # la première fois seulement
npx expo start
```

4. Un QR code s'affiche dans le terminal :
   - **Android** : ouvrez Expo Go, touchez « Scan QR code » ;
   - **iPhone** : ouvrez l'appareil photo et visez le QR code, puis touchez la bannière « Ouvrir dans Expo Go ».

L'appli se recharge toute seule à chaque modification du code. `Ctrl + C` dans le terminal pour arrêter.

Si le téléphone ne trouve pas l'ordinateur (Wi-Fi d'école, pare-feu) : `npx expo start --tunnel`. Si Windows demande d'autoriser Node.js sur le réseau, acceptez pour les réseaux privés.

## Voir l'appli dans Chrome, comme sur un téléphone

Avec `npx expo start` lancé, appuyez sur la touche `w` dans le terminal (ou lancez directement `npx expo start --web`). Chrome s'ouvre sur `http://localhost:8081`.

- Sur un ordinateur, la page montre l'appli dans un téléphone dessiné, à la largeur d'un vrai smartphone (390 points). Si la fenêtre est basse, le téléphone rapetisse pour tenir en entier.
- Dans une fenêtre étroite, ou sur un vrai téléphone, l'appli occupe toute la page.
- À la souris : la molette fait défiler, les petits points sous la carte de la résidence (ou le nom en haut) changent de résidence.

Le téléphone dessiné est dans `src/components/cadre-telephone.web.tsx`.

## Faire répondre Dobby (clé OpenRouter)

Sans clé, Dobby répond déjà avec des phrases préparées. Avec une clé OpenRouter, il répond librement, en restant dans son rôle (vouvoiement, phrases courtes, il connaît la maison, la famille et ses règles).

1. Ouvrez le fichier `.env.local` (dans `dobby-app`).
2. Collez la clé juste après le signe `=` : `OPENROUTER_API_KEY=sk-or-v1-...`
3. Arrêtez le serveur (`Ctrl + C`) puis relancez-le avec `npx expo start`.

Le terminal affiche alors `[Dobby] Clé OpenRouter trouvée`, puis, à chaque message, le modèle qui a répondu. Si un modèle gratuit est saturé, l'appli essaie le suivant ; si aucun ne répond, Dobby reprend ses phrases préparées et le terminal indique pourquoi.

- `.env.local` n'est jamais envoyé sur GitHub (il est dans `.gitignore`).
- Avec Expo Go, la clé est transmise au téléphone : c'est fait pour vos essais et vos démonstrations. La version en ligne, elle, ne contient jamais la clé (voir plus bas).
- Modèles gratuits : environ 50 messages par jour sans crédit acheté. Si le terminal affiche « No endpoints found matching your data policy », autorisez les modèles gratuits dans OpenRouter, Settings > Privacy.
- Pour choisir un autre modèle gratuit : ligne `OPENROUTER_MODEL=` dans `.env.local`.

## Mettre l'appli en ligne (Cloudflare)

L'appli a son propre dépôt GitHub, **Mael-AAA/dobby-app**, relié au Worker Cloudflare `dobby-app`. Chaque push sur `main` de ce dépôt remet l'appli en ligne : Cloudflare installe les dépendances, construit la version web (`npm run build:web`) et la publie. Comptez quelques minutes.

**1. Réglages du Worker** (tableau de bord Cloudflare, déjà faits) :

- dépôt : `Mael-AAA/dobby-app`, branche `main` ;
- Root directory : vide (`/`) ;
- Build command : vide ;
- Deploy command : `npx wrangler deploy` (valeur par défaut).

Le nom du Worker doit rester `dobby-app`, identique au `name` de `wrangler.jsonc`, sinon la mise en ligne échoue.

**2. Envoyer une modification** : depuis le dossier `dobby-app`, dans un terminal :

```bash
cd dobby-app
git add .
git commit -m "Ce que j'ai changé"
git push
```

Le dossier `dobby-app` est un dépôt à part : dans VS Code, l'onglet « Contrôle de code source » affiche deux dépôts, Dobby (le site) et dobby-app (l'appli). Le dépôt du site ignore le dossier de l'appli (fichier `.gitignore` à la racine de Dobby). `.env.local`, `node_modules` et `dist` ne partent jamais sur GitHub.

**3. Donner la clé à Cloudflare**, pour que Dobby réponde en ligne :

1. Ouvrez le Worker `dobby-app`, puis « Settings », rubrique « Variables and Secrets », bouton « Add ».
2. Type : **Secret**. Variable name : `OPENROUTER_API_KEY`. Value : votre clé.
3. « Deploy ».

N'ajoutez pas la clé dans « Build variables and secrets » : ces variables servent seulement pendant la construction, le Worker ne les voit pas.

**4. Vérifier.** L'adresse de l'appli s'affiche dans le tableau de bord, du type `https://dobby-app.<sous-domaine>.workers.dev`. En ajoutant `/api/dobby` à la fin de cette adresse, la page doit afficher `{"cle":"présente"}`.

Comment la clé est protégée :

- la page web ne contient aucune clé. Elle envoie les messages au Worker (`cloudflare/worker.js`), qui ajoute la clé et les transmet à OpenRouter ;
- `npm run build:web` vérifie qu'aucun fichier publié ne contient de clé, et arrête la mise en ligne si c'est le cas ;
- le Worker n'accepte que les modèles gratuits (aucun frais possible) et refuse les messages venant d'un autre site. Au pire, quelqu'un pourrait épuiser votre quota gratuit du jour : Dobby reprendrait alors ses phrases préparées.

Pour essayer la version en ligne sur l'ordinateur avant de pousser : `npx wrangler dev` (la première fois, répondez `y` pour installer Wrangler). Il construit la version web, puis la sert sur `http://localhost:8787`. En local, le Worker lit la clé dans `.env.local`.

## Ce qu'on trouve dans l'appli

| Onglet | Contenu |
| --- | --- |
| Accueil | État de Dobby par résidence (glisser entre Paris, Megève et Cap-Ferret), raccourcis, achats à valider, dernières actions |
| Messages | Conversation avec Dobby, raccourcis (« Nourrir Plume » : confirmation, puis photo quand c'est fait), demandes d'accord |
| Plan | Position de Dobby, Zones privées à fermer d'un toucher |
| Journal | Chaque action, à la minute près, par résidence ou toutes ensemble |
| Réglages | Volet des caméras, mémoire effaçable, budget d'achat, routines, famille et droits, Conseillère, garanties |

Le bouton rouge « Arrêt » est en haut de chaque écran. Écrire « stop » ou « Dobby, stop. » dans Messages fait de même. Pour relancer Dobby, il faut maintenir le bouton une seconde.

## Bon à savoir : le bandeau bleu « Refreshing... »

Avec Expo Go sur Android, un bandeau bleu marqué « Refreshing... » apparaît une seconde en haut de l'écran chaque fois qu'un fichier du projet change : l'appli recharge le code modifié. Il ne vient pas de l'appli et n'existe ni dans une appli installée, ni dans la version en ligne. Il apparaît souvent pendant qu'on modifie le code, et plus du tout quand personne n'y touche.

Pour ne plus le voir pendant une démonstration : secouez le téléphone pour ouvrir le menu d'Expo Go et désactivez « Fast Refresh ». Il faudra alors toucher « Reload » dans ce même menu pour voir une modification.

## Où modifier quoi

| Je veux changer… | Fichier |
| --- | --- |
| Résidences, pièces, raccourcis, journal de départ, routines, mémoire, famille | `src/data/maison.ts` |
| Ce que Dobby sait et sa façon de parler (consigne du modèle), réponses préparées | `src/lib/dobby-parle.ts` |
| Les modèles OpenRouter essayés | `src/lib/openrouter.ts` |
| Couleurs et polices | `src/theme.ts` |
| Un écran | `src/app/(onglets)/…` (onglets) et `src/app/…` (écrans des Réglages) |
| Le téléphone dessiné dans le navigateur | `src/components/cadre-telephone.web.tsx` |
| La mise en ligne (Worker, nom, dossier publié) | `wrangler.jsonc`, `cloudflare/worker.js`, `scripts/construire-web.mjs` |
| Icône et écran de lancement | `assets/images/` |

Vérifications : `npx tsc --noEmit` (types), `npm run lint` et `npm run build:web` (version web, sans clé).
