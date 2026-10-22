# Ce soir : ouvrir la caisse (22 octobre 2026)

Tout le code est prêt et en ligne. Il reste deux choses qui demandent ton compte.
Compter 30 à 40 minutes.

## 1. Lemon Squeezy : un compte, trois produits

Compte avec **inceept@gmail.com**. Lemon Squeezy est « vendeur officiel » (merchant of record) :
il encaisse, gère la TVA de chaque pays et te reverse le net. Sa commission est un frais
d'encaissement par vente (comme les 15 à 30 % d'Apple), pas une redevance.

1. Inscription : suivre `~/Projects/lisible-kit/CE_SOIR.md`, étape 1 (identité + RIB pour les versements).
2. Produit **Lisible Pro (web)**
   - Prix : **19 €**, paiement unique (pas d'abonnement).
   - **License keys : activées**, limite d'activations **3**, sans expiration.
   - Pas de fichier à livrer : la clé suffit.
   - Me donner : le **lien de paiement** (Share → checkout URL) et l'**identifiant du produit** (le nombre dans l'adresse de la page du produit).
3. Produits **Lisible Kit Team** (290 €/an) et **Lisible Kit Product** (990 €/an) : `~/Projects/lisible-kit/CE_SOIR.md`, étape 2. Me donner les 2 liens.

Ensuite je remplis `pro-config.js` (l'offre Pro apparaît alors sur les 12 pages de lecteurs)
et je branche les boutons de la page `/kit/` (aujourd'hui ils ouvrent un e-mail vers toi).

## 2. Google Search Console : savoir si les pages attirent du monde

Sans ça on ne sait pas combien de gens arrivent sur les lecteurs (aucune mesure d'audience sur le site, volontairement).

1. https://search.google.com/search-console → **Ajouter une propriété** → **Préfixe de l'URL** :
   `https://komorebideuxiemedunom.github.io/lisible-app/`
2. Méthode **Balise HTML** : copier la valeur `content="…"` et me la donner.
   Je l'ajoute à la page d'accueil, puis tu cliques **Valider**.
3. Une fois validé : **Sitemaps** → ajouter `sitemap.xml`.
4. Même chose pour `https://komorebideuxiemedunom.github.io/hourglass-app/` (calculateurs heures de conduite / conduite accompagnée), pour `https://komorebideuxiemedunom.github.io/creux-app/` (vérification gratuite des heures creuses, renvoie vers Creux), pour `https://komorebideuxiemedunom.github.io/nounette-app/` (nouveau simulateur de salaire, qui renvoie vers Nounette, déjà en vente) et, si tu veux, `https://komorebideuxiemedunom.github.io/hop-app/`.

## Ce qui est déjà fait

- Lecteurs en ligne : la lecture d'un fichier reste gratuite. Lisible Pro (19 €) ouvre plusieurs fichiers
  d'un coup, les résume dans un tableau, exporte un CSV pour Excel ou le comptable et télécharge
  tous les documents et pièces jointes dans un ZIP. La clé est vérifiée dans le navigateur
  (API publique de licences de Lemon Squeezy), aucun fichier ne quitte l'ordinateur.
- Tant que `pro-config.js` est vide, rien de tout ça n'est visible : le site marche comme avant.
- Page de vente Lisible Kit en ligne sur `/kit/`.
- App Store (22/10, 9 h) : soumissions de Roomy et ProtoKomo annulées (réversible), message de recentrage envoyé à YET, Hop et Lisible. On attend Apple ; ne rien soumettre d'autre d'ici là, Lueur compris.
- 22/10 après-midi : les lecteurs en ligne lisent maintenant les PDF Factur-X / ZUGFeRD (le XML caché dedans), nouvelles pages « Lire une facture Factur-X » (FR), KSeF (polonais) et Peppol (néerlandais/Belgique). Protection des données renforcée : règle de sécurité (CSP) qui interdit toute connexion sauf la vérification de licence, aucune info sur l'appareil envoyée, page de confidentialité réécrite (FR/EN, durées de conservation, RGPD). Les boutons « Télécharger Lisible » (app pas encore publiée) sont remplacés par « Bientôt sur l'App Store ».
- 22/10 : simulateur gratuit « Calcul du salaire d'une assistante maternelle » sur le site de Nounette (déjà en vente), avec un lien vers l'App Store : il peut rapporter dès maintenant, sans attendre Lemon Squeezy.
- 22/10 : vérification gratuite « Mes heures creuses vont-elles changer ? » sur le site de Creux (en vente), et le site d'assistance de Creux ne cite plus aucune marque (cause du refus d'octobre).
- 22/10 : calculateurs gratuits sur le site d'Hourglass (en vente) : heures de conduite par État américain (anglais) et km par semaine en conduite accompagnée (français).
