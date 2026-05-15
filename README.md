# Menu Hebdo

Une mini-app PWA pour planifier ses repas de la semaine, swapper ses recettes et générer automatiquement sa liste de courses. Installable sur iPhone, fonctionne hors-ligne.

> **App en ligne :** https://menu-hebdo.netlify.app
>
> Sur iPhone : ouvre l'URL dans Safari → Partager → Ajouter à l'écran d'accueil.

## Idée

- Choisir un menu thématique parmi une dizaine (Méditerranéen, Asiatique, Hiver, Batch cooking, Végé, Express…).
- Personnaliser la semaine en swappant les recettes qui ne plaisent pas.
- Régler le nombre de personnes (1 à 12) avec scaling automatique des quantités.
- Récupérer une liste de courses agrégée, par rayon, cochable, qui fonctionne hors-ligne au supermarché.

## Stack

- HTML + CSS + JavaScript vanilla — pas de framework.
- PWA basique : `manifest.json` + service worker (cache-first).
- État local uniquement (`localStorage`), pas de backend.
- Déployable en statique (Netlify, GitHub Pages).

## Fonctionnalités prévues (MVP)

- 3 onglets : Semaine, Courses, Recettes.
- Wizard "Démarrer ma semaine" en 3 étapes.
- ~60-80 recettes structurées, ~10 menus thématiques.
- Scaling intelligent par recette ou global, avec arrondi adapté à l'unité.
- Mode supermarché grande typo, drag&drop des rayons selon ton magasin.
- Notes perso, favoris, substitutions d'ingrédients, timer intégré.
- Partage natif iOS de la liste de courses.
- Badges de saisonnalité, historique des semaines passées.

## Design

Design system iOS minimaliste par défaut (système fonts, palette neutre, accent orange), avec un thème alternatif "terracotta luxe" en option.

Spec complète : [`docs/superpowers/specs/2026-05-15-menu-app-design.md`](docs/superpowers/specs/2026-05-15-menu-app-design.md).

## Structure du projet

```
/
├── index.html              # App shell
├── app.js                  # Logique
├── styles.css              # Design system
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker
├── icons/                  # Icônes PWA
├── data/
│   ├── recipes.json        # Catalogue de recettes
│   ├── menus.json          # Menus thématiques
│   └── seasonality.json    # Calendrier de saisonnalité
└── docs/
    └── superpowers/specs/  # Specs de design
```

## Développement

L'app étant 100% statique, n'importe quel serveur HTTP local fonctionne pour développer :

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

## Licence

MIT.
