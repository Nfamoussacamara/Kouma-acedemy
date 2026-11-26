# Spécifications et Adaptations Backend

Ce document récapitule l'ensemble des ajustements à apporter à l'API Backend pour s'aligner sur les nouvelles fonctionnalités et règles métiers intégrées côté Frontend.

---

## 1. Harmonisation des Statuts

### Pannes
- **Statuts autorisés** :
  - `"en_attente"` : Panne déclarée, en attente de prise en charge ou de diagnostic.
  - `"en_cours"` : Diagnostic ou intervention en cours.
  - `"resolue"` : Panne résolue / clôturée.
- **Statut par défaut à la création** : `"en_attente"`.
- **Rétrocompatibilité / Migration** :
  - Mapper les anciens statuts `"NOUVELLE"` ou `"brouillon"` vers `"en_attente"`.
  - Mapper `"CLOTUREE"` vers `"resolue"`.

### Commandes
- **Statuts autorisés** :
  - `"en_attente"` : Commande initiée par l'utilisateur, en attente de signature et de validation administrative.
  - `"commandee"` : Commande validée et lancée par l'administrateur auprès du fournisseur.
  - `"recu"` : Commande réceptionnée, vérifiée et facturée.
- **Statut par défaut à la création** : `"en_attente"`.
- **Rétrocompatibilité / Migration** :
  - Mapper `"brouillon"` vers `"en_attente"`.
  - Mapper `"emise"` ou `"partiellement_recue"` vers `"commandee"`.
- **Transitions autorisées** :
  - `"en_attente"` $\rightarrow$ `"commandee"` $\rightarrow$ `"recu"`.

---

## 2. Création de Commande (`POST /commandes`)

### Permissions & Authentification
- Les utilisateurs standard (rôle non-admin) doivent avoir l'autorisation de créer une commande.
- Le backend doit associer automatiquement l'utilisateur connecté comme demandeur :
  - `demandeur` : `req.user._id` (ou `req.user.id`).
  - `createdBy` : `req.user._id`.

### Schéma du payload assoupli
```json
{
  "panne": "65b...",          // Optionnel (null ou absent si commande directe)
  "equipements": [
    {
      "equipement": "65a...",  // ID équipement (requis)
      "quantiteCommandee": 2    // Nombre entier >= 1 (requis)
    }
  ],
  "status": "en_attente"       // Par défaut
}
```

> [!IMPORTANT]
> - **Fournisseur** : Ne doit **plus être obligatoire** à la création (`required: false`). L'administrateur l'assignera lors de la validation.
> - **Prix** : Aucun prix n'est envoyé à la création (`prixtotal` initialisé à `0` ou `null`).

---

## 3. Filtrage des Commandes selon le Rôle (`GET /commandes`)

### Règle d'accès
- **Utilisateur simple (non-admin)** :
  - La liste retournée contient ses propres commandes et celles créées par un Admin pour sa structure sanitaire.
  - Le backend détermine `creeParAdmin` à la création lorsqu'un Admin fournit au moins une structure destinataire. Ce champ ne doit pas être piloté par le client.
  - Pour les commandes d'Admin, la structure autorisée vient du token de l'utilisateur, pas d'un paramètre de requête.
  - Les commandes personnelles restent restreintes au demandeur :
    ```javascript
    // Pour une commande personnelle :
    if (req.user.role !== 'Admin') {
      filter.demandeur = req.user._id;
    }
    ```
- **Administrateur** :
  - Retourne toutes les commandes de la structure sans restriction de demandeur.
- **Paramètre de requête** :
  - Supporter le paramètre `?demandeur=<userId>` pour permettre un filtrage explicite par l'administration.

---

## 4. Lancement & Validation de la Commande par l'Admin (`PATCH /commandes/:id`)

### Rôle requis : `Admin`
Cette action intervient lorsque l'administrateur examine la commande au statut `"en_attente"` :
1. **Fournisseur retenu** : L'admin sélectionne le fournisseur (`fournisseur: providerId`).
2. **Quantités demandées vs Quantités commandées** :
   - Chaque équipement dans `equipements` comporte :
     - `quantiteDemandee` : La quantité initialement demandée par l'utilisateur demandeur (ne change jamais, conservée pour traçabilité).
     - `quantiteCommandee` (ou `quantiteValidee`) : La quantité ajustée par l'administrateur pour la commande passée au fournisseur.
3. **Statut** : Le statut passe à `"commandee"`.
4. **Fiche Fournisseur** : L'admin imprime le bon de commande adressé au fournisseur contenant les quantités validées/ajustées.
5. **Accès immédiat à la réception** : Dès l'enregistrement (`status: "commandee"`), le bouton **"Réceptionner"** devient accessible.

---

## 5. Réception & Enregistrement des Prix (`POST /commandes/:id/receptions`)

### Rôle requis : `Admin`
C'est **uniquement lors de la réception physique des équipements** que les prix réels sont saisis.

### Payload attendu
```json
{
  "equipementsRecus": [
    {
      "equipement": "65a...",
      "quantiteRecue": 2,
      "prixUnitaire": 1500000
    }
  ]
}
```

### Traitements Backend :
- Enregistrer la ligne de réception avec date et utilisateur réceptionnaire.
- **Calcul automatique du `prixtotal`** :
  $$\text{prixtotal} = \sum (\text{quantiteRecue} \times \text{prixUnitaire})$$
- Mettre à jour le statut global de la commande vers `"recu"` si tous les articles sont livrés.

---

## 6. Téléversement du Bon de Commande Signé

### Contexte métier
Après création de la commande, l'utilisateur imprime le bon de commande généré, le signe manuellement, puis téléverse le scan/photo du document signé afin que l'administrateur puisse le vérifier avant de commander.

### Endpoint recommandé : `POST /commandes/:id/bon-signe`
- **Méthode** : `POST`
- **En-tête** : `Content-Type: multipart/form-data`
- **Champ du formulaire** : `file` (ou `bon_signe`)
- **Formats acceptés** : PDF, PNG, JPG, JPEG, WEBP (taille max recommandée : 10 Mo).
- **Structure des métadonnées stockées dans la commande** :
  ```json
  "bonSigne": {
    "url": "https://storage.example.com/commandes/cmd-123-signe.pdf",
    "nomOriginal": "bon_de_commande_signe.pdf",
    "taille": 348210,
    "mimeType": "application/pdf",
    "uploadedAt": "2026-11-19T10:15:00.000Z",
    "uploadedBy": "65c..."
  }
  ```
- **Disponibilité des données** :
  - Le champ `bonSigne` doit être inclus dans la réponse de `GET /commandes/:id` pour permettre la visualisation et le téléchargement du fichier par l'utilisateur et par l'administrateur.
