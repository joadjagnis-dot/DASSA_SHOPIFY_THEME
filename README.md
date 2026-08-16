# Thème Shopify DASSA — Online Store 2.0

Thème Shopify natif reproduisant fidèlement le site DASSA (Bissap Pétillant) : hero rouge/orange animé, vraies canettes détourées, sections cocktails, store locator Leaflet, FAQ, infolettre et panier drawer AJAX.

## Structure

```
shopify-theme/
├── layout/theme.liquid          # Layout principal (fonts, CSS, JS, header/footer)
├── templates/                   # Templates JSON OS 2.0 (index, product, cart, etc.)
├── sections/                    # Sections configurables avec {% schema %}
│   ├── dassa-header.liquid      # Barre d'annonce + navigation sticky
│   ├── dassa-hero.liquid        # Hero avec canettes réelles + animations
│   ├── dassa-benefits.liquid    # Carte crème 4 bénéfices (blocks)
│   ├── dassa-marquee.liquid     # Bandeau défilant
│   ├── dassa-products.liquid    # Cartes produits (produits Shopify + variantes)
│   ├── dassa-cocktails.liquid   # Recettes avec modals (blocks)
│   ├── dassa-store-locator.liquid # Carte Leaflet + points de vente (blocks)
│   ├── dassa-story.liquid       # Notre histoire
│   ├── dassa-faq.liquid         # FAQ accordéon (blocks)
│   ├── dassa-newsletter.liquid  # Infolettre (formulaire client Shopify natif)
│   ├── dassa-footer.liquid      # Pied de page
│   └── main-*.liquid            # Sections des pages standards
├── snippets/cart-drawer.liquid  # Panier latéral AJAX
├── assets/                      # CSS, JS, images canettes/cocktails
├── config/                      # settings_schema.json + settings_data.json
└── locales/fr.default.json      # Traductions FR
```

## Prérequis

1. [Shopify CLI](https://shopify.dev/docs/themes/tools/cli/install) ≥ 3.x
   ```bash
   npm install -g @shopify/cli@latest
   ```
2. Une boutique Shopify (ou boutique de développement via [Shopify Partners](https://partners.shopify.com))

## Configuration du catalogue (obligatoire)

Le thème ne code AUCUN prix ni produit en dur. Créez dans l'admin Shopify (**Produits → Ajouter un produit**) :

| Produit | Variantes (option « Format ») | Prix |
|---|---|---|
| Bissap Pétillant Menthe | Pack de 4 / Pack de 12 / Pack de 24 | 24 $ / 45 $ / 84 $ |
| Bissap Pétillant Ananas | Pack de 4 / Pack de 12 / Pack de 24 | 24 $ / 45 $ / 84 $ |
| Pack Découverte Mix | Pack de 4 / Pack de 12 / Pack de 24 | 24 $ / 45 $ / 84 $ |

Ajoutez les images de canettes aux produits (les fichiers `dassa-can-menthe.png` et `dassa-can-ananas.png` sont dans `assets/`).

Ensuite, dans **Boutique en ligne → Thèmes → Personnaliser → Page d'accueil → section « Nos boissons DASSA »**, assignez chaque produit Shopify à sa carte (Menthe / Ananas / Mix).

## Test en local

```bash
cd shopify-theme
shopify theme dev --store votre-boutique.myshopify.com
```

Ouvre un aperçu local sur http://127.0.0.1:9292 avec hot-reload.

## Vérification

```bash
shopify theme check
```

## Déploiement

```bash
# Pousser comme thème non publié (recommandé pour la première fois)
shopify theme push --unpublished --theme "DASSA"

# Pousser et publier directement
shopify theme push --theme "DASSA" --publish
```

## Intégration GitHub

1. Poussez le dossier `shopify-theme/` dans un dépôt GitHub (le contenu du thème doit être à la racine du dépôt ou d'une branche dédiée).
2. Dans l'admin Shopify : **Boutique en ligne → Thèmes → Ajouter un thème → Connecter depuis GitHub**.
3. Chaque commit sur la branche connectée synchronise automatiquement le thème.

## Personnalisation (Theme Editor)

Toutes les sections de la page d'accueil sont configurables sans code :
- **Hero** : textes, CTA, images, badge Québec
- **Bénéfices** : 4 blocs icône + titre + texte
- **Nos boissons** : produit Shopify, couleur de carte, textes par bloc
- **Cocktails** : nom, type, temps, photo, ingrédients, étapes, produit lié
- **Store Locator** : blocs points de vente (nom, adresse, ville, lat/lng, visibilité)
- **FAQ** : blocs question/réponse
- **Infolettre / Notre histoire / Footer** : textes, images, menus, réseaux sociaux
- **Livraison gratuite** : seuil configurable dans Paramètres du thème → Livraison

## Fonctionnalités natives Shopify

- Panier : AJAX Cart API (`/cart/add.js`, `/cart/change.js`) + drawer personnalisé
- Checkout et commandes : 100 % Shopify natif
- Infolettre : formulaire `{% form 'customer' %}` (clients tagués `newsletter`)
- Recherche : `/search` natif
- Politiques légales : liens vers `/policies/*` de Shopify

## Notes

- La carte du Store Locator utilise Leaflet + OpenStreetMap (CDN, chargé en lazy loading, aucune clé API requise).
- Ne jamais écrire DASSA avec trois S.
- Le point de vente « IGA Lac Beauport » est masqué (`visible: false`) tant que son adresse n'est pas confirmée.
