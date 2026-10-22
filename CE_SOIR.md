# Ce soir : ouvrir la caisse (22 octobre 2026)

Tout le code est prêt et en ligne. Il reste trois choses qui demandent tes comptes.
Compter 45 minutes.

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
4. Même chose, si tu veux, pour `https://komorebideuxiemedunom.github.io/hop-app/`.

## 3. App Store : recentrer le compte (Mac ou PC, 10 min)

Apple n'a toujours pas répondu (vérifié ce matin) et demande de ne rien renvoyer. Le garde-fou m'empêche
d'annuler une soumission ou d'écrire dans App Store Connect, donc c'est pour toi.

1. **Retirer Roomy et ProtoKomo de la vérification** (réversible, rien n'est supprimé, on pourra les resoumettre) :
   l'app → **Vérification de l'app** → la soumission 1.0 → **Annuler la soumission** → confirmer.
   - Roomy : https://appstoreconnect.apple.com/apps/6820056112/distribution/reviewsubmissions/details/94119a15-ef5e-4e5b-ae3d-905109815a36
   - ProtoKomo : https://appstoreconnect.apple.com/apps/6821920010/distribution/reviewsubmissions/details/a819bffe-a737-4723-8e59-e758107b9eb7
   - Surtout pas « Supprimer l'app » : ça brûle le nom et l'identifiant pour toujours.
2. **Ensuite seulement**, envoyer le même message dans les fils de YET, Hop et Lisible
   (**Répondre à l'équipe de vérification des apps**, coller, **Répondre**) :
   - YET : https://appstoreconnect.apple.com/apps/6817475008/distribution/reviewsubmissions/details/ecad7075-b0de-49b7-92b8-9c8a7226627f
   - Hop : https://appstoreconnect.apple.com/apps/6818609255/distribution/reviewsubmissions/details/3cd4c296-40e3-4642-b0a1-721de598f1b1
   - Lisible : https://appstoreconnect.apple.com/apps/6818609797/distribution/reviewsubmissions/details/c29ef71b-a8ef-4057-af9d-f5ab28345b6c

```
Hello,

A short update on your fifth question, about apps published under the same account.

To keep our account focused on apps that are clearly distinct, we have withdrawn two submissions from review: Roomy (a photo storage cleaner) and ProtoKomo (a personal tool that will stay a private build).

The apps we are asking you to review are now:
- YET, a bucket list planner,
- Hop, which sends files from an iPhone to Windows PCs and Android phones,
- Lisible, a viewer for electronic invoices and signed .p7m files.

They do not overlap in purpose or audience, and each one is a standalone product. Our apps already on the App Store (Creux, Gymbros, Nounette, Hourglass) are unchanged.

Thank you for your time.

Lucas Dansac
```

Ne rien soumettre d'autre (Lueur compris) tant qu'Apple n'a pas répondu à ces trois-là.

## Ce qui est déjà fait

- Lecteurs en ligne : la lecture d'un fichier reste gratuite. Lisible Pro (19 €) ouvre plusieurs fichiers
  d'un coup, les résume dans un tableau, exporte un CSV pour Excel ou le comptable et télécharge
  tous les documents et pièces jointes dans un ZIP. La clé est vérifiée dans le navigateur
  (API publique de licences de Lemon Squeezy), aucun fichier ne quitte l'ordinateur.
- Tant que `pro-config.js` est vide, rien de tout ça n'est visible : le site marche comme avant.
- Page de vente Lisible Kit en ligne sur `/kit/`.
