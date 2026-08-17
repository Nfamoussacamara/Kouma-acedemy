import jwt from 'jsonwebtoken';
import config from '../src/config/index.js';

const API_URL = `http://localhost:${config.port}${config.apiPrefix}`;

async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    json = { raw: text };
  }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} sur ${endpoint}: ${JSON.stringify(json)}`);
  }
  return json;
}

async function getValidToken() {
  const possibleSecrets = [
    config.jwtSecret,
    'qLdrzw2gH50IgJdSeyIZ0zqXIM94L0vxptg2j84Mlmp',
    'super-secure-dev-secret-key-for-kouma-academy',
    'dev-secret'
  ];

  for (const secret of possibleSecrets) {
    try {
      const token = jwt.sign(
        { id: '67a000000000000000000001', username: 'admin', type: 'Admin' },
        secret,
        { expiresIn: '1h' }
      );
      await request('/type-equipements', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return token;
    } catch (e) {
      // continuer
    }
  }

  throw new Error("Impossible de valider le token");
}

async function runFullScenario() {
  console.log('---------------------------------------------------------------');
  console.log(`🚀 CONNEXION À L'API EN DIRECT SUR : ${API_URL}`);
  console.log('---------------------------------------------------------------\n');

  console.log('=== 1. VALIDATION DU JETON ADMIN ===');
  const token = await getValidToken();
  console.log('✔ Token JWT Admin validé');

  const authHeaders = { Authorization: `Bearer ${token}` };

  console.log('\n=== 2. CRÉATION TYPE ÉQUIPEMENT (POST /type-equipements) ===');
  const typeRes = await request('/type-equipements', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      nom: `Réseau & IT ${Date.now()}`,
      description: 'Équipements réseau professionnels'
    })
  });
  const typeId = typeRes.data._id;
  console.log('✔ Type créé :', typeRes.data.nom, `\n   ↳ ID: ${typeId}`);

  console.log('\n=== 3. CRÉATION FOURNISSEUR (POST /fournisseurs) ===');
  const fournisseurRes = await request('/fournisseurs', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      nom: `CONAKRY NETWORKS ${Date.now()}`,
      contact: '+224622112233',
      adresse: 'Kaloum, Conakry'
    })
  });
  const fournisseurId = fournisseurRes.data._id;
  console.log('✔ Fournisseur créé :', fournisseurRes.data.nom, `\n   ↳ ID: ${fournisseurId}`);

  console.log('\n=== 4. CRÉATION ÉQUIPEMENT AU CATALOGUE (POST /equipements) ===');
  const eqRes = await request('/equipements', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      designation: 'Switch Cisco Catalyst 24 Ports PoE+',
      type: typeId,
      fournisseur: fournisseurId,
      prix: 450,
      caracteristique: 'Gigabit 1000Mbps, manageable VLAN'
    })
  });
  const equipementId = eqRes.data._id;
  console.log('✔ Équipement créé :', eqRes.data.designation, `\n   ↳ Prix: ${eqRes.data.prix} GNF | ID: ${equipementId}`);

  console.log('\n=== 5. DÉCLARATION D\'UNE PANNE (POST /pannes) ===');
  const panneRes = await request('/pannes', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      description: 'Coupure réseau suite à défaillance du switch principal',
      type_panne: 'Équipement',
      equipement: {
        designation: 'Switch Cisco Catalyst 24 Ports',
        qte: 1,
        modele: 'C2960'
      },
      cause: 'Surtension électrique',
      niveau_urgence: 'Critique',
      impact_services: ['Arrêt des soins', 'Un service complet'],
      tentatives_realisees: ['Redémarrage des équipements', 'Vérification des alimentations'],
      besoin_intervention: true
    })
  });
  const panneId = panneRes.data._id;
  console.log('✔ Panne déclarée :', panneRes.data.description);
  console.log(`   ↳ Statut: ${panneRes.data.statut} | Urgence: ${panneRes.data.niveau_urgence} | ID: ${panneId}`);

  console.log('\n=== 6. CRÉATION D\'UNE COMMANDE LIÉE À LA PANNE (POST /commandes) ===');
  const cmdRes = await request('/commandes', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      panne: panneId,
      fournisseur: fournisseurId,
      articles: [
        {
          equipement: equipementId,
          designation: 'Switch Cisco Catalyst 24 Ports PoE+',
          quantiteCommandee: 2,
          prixUnitaire: 450
        }
      ]
    })
  });
  const cmdId = cmdRes.data._id;
  console.log('✔ Commande émise :', cmdRes.data.numero);
  console.log(`   ↳ Montant: ${cmdRes.data.prixtotal} GNF | Statut: ${cmdRes.data.status} | ID: ${cmdId}`);

  console.log('\n=== 7. VÉRIFICATION DU DÉTAIL DE LA PANNE (GET /pannes/:id) ===');
  const panneDetailRes = await request(`/pannes/${panneId}`, {
    method: 'GET',
    headers: authHeaders
  });
  console.log('✔ Panne récupérée avec', panneDetailRes.data.commandes.length, 'commande(s) rattachée(s) :');
  console.log(`   ↳ Numéro commande liée : ${panneDetailRes.data.commandes[0].numero} | Montant : ${panneDetailRes.data.commandes[0].prixtotal} GNF`);

  console.log('\n=== 8. RÉCEPTION DE LA COMMANDE (POST /commandes/:id/receptions) ===');
  const recRes = await request(`/commandes/${cmdId}/receptions`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      articlesRecus: [
        {
          equipement: equipementId,
          quantiteRecue: 2,
          prixUnitaire: 450
        }
      ]
    })
  });
  console.log('✔ Réception enregistrée :', recRes.message);
  console.log(`   ↳ Nouveau statut commande : ${recRes.data.status}`);
  console.log(`   ↳ Quantité reçue : ${recRes.data.articles[0].quantiteRecue} / ${recRes.data.articles[0].quantiteCommandee}`);

  console.log('\n===============================================================');
  console.log('🎉 TOUTES LES REQUÊTES EN DIRECT ONT RÉUSSI AVEC SUCCÈS !');
  console.log('===============================================================');
}

runFullScenario().catch(err => {
  console.error('Erreur lors du scénario :', err.message);
});
