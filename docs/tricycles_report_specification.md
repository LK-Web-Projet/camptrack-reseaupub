# Rapport Campagne Tricycles - Spécifications de Génération PDF

Ce document définit la structure exacte, les attentes en matière de chemins de fichiers et les instructions de mise en page nécessaires pour la génération programmatique du rapport spécifique aux campagnes "Tricycles". Ce rapport est formaté sur trois pages distinctes.

---

## Page 1 : Page de Garde et Présentation Principale

**Objectif :** Fournir l'identité visuelle de la campagne et introduire le rapport.

**Éléments requis et mise en page :**
1. **Image Principale (Image 1) :**
   - **Chemin attendu :** `public/images/tricycles.avif`
   - **Mise en page :** Centrée ou placée verticalement au centre/haut de la page. Cette image doit occuper une part importante pour donner le contexte (illustration d'un tricycle en affichage).
   - *Note technique* : Les bibliothèques PDF comme React-PDF ou jsPDF ne supportent parfois pas nativement le format AVIF. Il peut être nécessaire de prévoir une conversion à la volée en JPG/PNG ou de s'assurer de sa compatibilité.
2. **Logo de l'Entreprise (Image 2) :**
   - **Chemin attendu :** `public/images/logo_mixte.webp`
   - **Mise en page :** Généralement placé en haut à gauche, en haut au centre, ou en pied de page.
   - *Note technique* : Le format WEBP doit également être vérifié selon le moteur de génération PDF. 
3. **Titre Principal :**
   - **Texte :** `RAPPORT CAMPAGNE TRICYCLES [Nom de la Campagne]`
   - **Mise en page :** Typographie imposante (ex: 24pt-32pt), en gras, centrée, généralement text-transform uppercase.
4. **Sous-titre / Titre de section :**
   - **Texte :** `Récapitulatif des images des tricycles`
   - **Mise en page :** Sous le titre principal, typographie de taille moyenne (ex: 14pt-18pt), centrée ou justifiée, avec une couleur secondaire ou un style régulier/italique pour contraster.

---

## Page 2 : Statistiques et Vue d'Ensemble

**Objectif :** Présenter les indicateurs clés de performance (KPI) de la campagne de manière claire et aérée.

**Éléments requis et mise en page :**
1. **Focus du contenu :**
   - L'espace de la page doit être majoritairement dédié à une présentation claire des chiffres.
2. **Tableau des Statistiques :**
   - **Mise en forme :** Un tableau de données stylisé (lignes alternées, en-têtes distinctes, bordures discrètes ou cartes de type "Grid").
   - **Champs de données devant figurer obligatoirement :**
     - *Nombre total de tricycles demandé* (Cible)
     - *Nombre total de panneaux affiché* (Réalisation)
     - *Durée de la campagne* (En jours ou mois)
     - *Date du démarrage* (Prévue au format JJ/MM/AAAA)
     - *Fin de la campagne* (Format JJ/MM/AAAA)
   - **Source de données (Prisma) :** Ces informations découlent directement des propriétés de la table `Campagne` (`nbr_prestataire`, `date_debut`, `date_fin`) et du compte des relations actives dans `PrestatairesCampagne`.

---

## Page 3 : Récapitulatif Technique (Immatriculations)

**Objectif :** Fournir l'inventaire complet des moyens de diffusion (les tricycles) ayant participé à la campagne.

**Éléments requis et mise en page :**
1. **Titre de la section :**
   - **Texte :** `RECAP DES NUMEROS DES TRICYCLES`
   - **Mise en page :** En-tête de page, majuscules, en gras (ex: 18pt), accompagné potentiellement d'un séparateur horizontal.
2. **Affichage des données (Tableau des Plaques) :**
   - **Contenu :** Liste itérative des numéros de plaques d'immatriculation (`plaque` depuis la table `Prestataire`) de tous les intervenants (tricycles) assignés à la campagne.
   - **Mise en page :** Tableau multi-colonnes (ou grille) remplissant tout l'espace disponible de la page. Si la liste est longue, elle doit déclencher un saut de page automatique (pagination) tout en gardant l'en-tête du tableau sur les pages suivantes.
3. **Note de bas de page (Footer Note) :**
   - **Texte :** `NB : Au total, [X] tricycles ont été déployés pour cette campagne.` (ou texte dérivé de *"NB : Au tot..."*).
   - **Mise en page :** Fixé en bas de la dernière page du tableau ou répété dans le pied de page, police de petite taille (ex: 9pt-10pt), en italique.

---

## Recommandations d'Implémentation Technique

Si la génération s'effectue via **@react-pdf/renderer** (l'outil configuré sur le projet) :
- **Composants :** Créer un composant spécifique `<TricycleReport />`.
- **Gestion des Images :** Si `avif` ou `webp` ne sont pas supportés par `@react-pdf/image`, implémenter une conversion côté serveur (via un endpoint Next.js par exemple en utilisant `sharp`) avant de passer l'URL absolue (JPEG/PNG) au `<Image src="..." />`.
- **Polices (Fonts) :** Poursuivre avec la police standard supportée (Helvetica) ou injecter des fichiers `.ttf` locaux pour éviter les erreurs de format (WOFF/WOFF2 ne fonctionneront pas).
