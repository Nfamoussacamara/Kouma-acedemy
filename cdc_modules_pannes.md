Fiche Backend — Module Panne
Visa Médical — KOUMA ACADEMY SAS
1. Modèle de données
javascript
const panneSchema = new Schema({
  description: {
    type: String,
    required: true
  },
  type_probleme: {
    type: String,
    enum: ['Équipement', 'Espace/Système'],
    required: true
  },
  equipement: {
    designation: { type: String },
    qte: { type: Number },
    modele: { type: String }
    // rempli seulement si type_probleme = 'Équipement'
  },
  systeme: {
    type: String,
    enum: ['BE', 'Admin', 'Médecin', 'Pharmacie']
    // rempli seulement si type_probleme = 'Espace/Système'
  },
  cause: {
    type: String
  },
  nature_demande: {
    type: String
  },
  niveau_urgence: {
    type: String,
    enum: ['Faible', 'Moyen', 'Élevé', 'Critique'],
    required: true
  },
  impact_services: [{
    type: String
  }],
  tentatives_realisees: [{
    type: String
  }],
  besoin_intervention: {
    type: Boolean,
    required: true,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Panne', panneSchema);
2. Règles de validation métier (à implémenter côté contrôleur, pas juste le schéma)
Si type_probleme = 'Équipement' → equipement.designation devient obligatoire (le schéma seul ne peut pas conditionner ça, à valider dans le contrôleur avant .save())
Si type_probleme = 'Espace/Système' → systeme devient obligatoire
Les deux blocs (equipement et systeme) sont mutuellement exclusifs — rejeter si les deux sont remplis en même temps
impact_services et tentatives_realisees : valeurs autorisées à whitelister côté serveur (ne pas faire confiance à un tableau de strings libres envoyé par le front) — sinon prévoir un enum strict dans le schéma directement
3. Endpoints REST attendus
Méthode	Route	Description	Body / Query
POST	/api/pannes	Créer une panne	Body = champs du modèle
GET	/api/pannes	Lister les pannes	Query : niveau_urgence, type_probleme, besoin_intervention, pagination (page, limit)
GET	/api/pannes/:id	Détail d'une panne	—
PATCH	/api/pannes/:id	Modifier une panne	Body = champs à mettre à jour
DELETE	/api/pannes/:id	Supprimer une panne	— (à confirmer si vraiment autorisé, ou juste un statut "archivée")
4. Comportement du GET liste
Tri par défaut : niveau_urgence (Critique en premier) puis createdAt décroissant. Comme niveau_urgence est un enum non ordonné nativement en Mongo, prévoir un mapping côté backend :