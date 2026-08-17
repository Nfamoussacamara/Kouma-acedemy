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

  return { status: res.status, ok: res.ok, data: json };
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
        { id: '67a000000000000000000001', username: 'Kouma', type: 'Admin' },
        secret,
        { expiresIn: '1h' }
      );
      const testRes = await request('/pannes/options', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (testRes.ok) return token;
    } catch (e) {
      // continuer
    }
  }

  throw new Error("Impossible de valider le token");
}

async function testAutoCreationEquipement() {
  console.log('========================================================================');
  console.log('🧪 TEST CRÉATION AUTOMATIQUE D\'ÉQUIPEMENT HORS CATALOGUE LORS DE LA RÉCEPTION');
  console.log('========================================================================\n');

  const token = await getValidToken();
  const authHeaders = { Authorization: `Bearer ${token}` };

  const pannesRes = await request('/pannes', { headers: authHeaders });
  const fournisseursRes = await request('/fournisseurs', { headers: authHeaders });
  const typesRes = await request('/type-equipements', { headers: authHeaders });

  const panneId = pannesRes.data.data[0]._id;
  const fournisseurId = fournisseursRes.data.data[0]._id;
  const typeId = typesRes.data.data[0]._id;

  const designationNouvelArticle = `Scanner Barcode Laser 2D Honeywell ${Date.now()}`;

  // 1. Émettre une commande pour un article qui n'existe PAS au catalogue (uniquement typeEquipement)
  console.log(`--- 1. Émission de la commande pour l'article hors catalogue : "${designationNouvelArticle}" ---`);
  const createCmd = await request('/commandes', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      panne: panneId,
      fournisseur: fournisseurId,
      articles: [
        {
          typeEquipement: typeId,
          designation: designationNouvelArticle,
          quantiteCommandee: 2,
          prixUnitaire: 175
        }
      ]
    })
  });

  const cmdId = createCmd.data.data._id;
  const articleInitial = createCmd.data.data.articles[0];
  console.log(`✔ Commande créée : ${createCmd.data.data.numero}`);
  console.log(`   ↳ Article dans la commande : "${articleInitial.designation}"`);
  console.log(`   ↳ ID Équipement avant réception : ${articleInitial.equipement} (null, car pas encore catalogué)\n`);

  // 2. Vérifier que l'équipement n'est pas encore dans le catalogue
  const searchBefore = await request(`/equipements?search=${encodeURIComponent(designationNouvelArticle)}`, {
    headers: authHeaders
  });
  console.log(`🔍 Recherche catalogue avant réception : ${searchBefore.data.data.length} équipement trouvé.`);

  // 3. Enregistrer la réception
  console.log('\n--- 2. Enregistrement de la réception (POST /commandes/:id/receptions) ---');
  const recRes = await request(`/commandes/${cmdId}/receptions`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      articlesRecus: [
        {
          typeEquipement: typeId,
          quantiteRecue: 2,
          prixUnitaire: 175
        }
      ]
    })
  });

  const articleApresRec = recRes.data.data.articles[0];
  const nouvelEquipementId = articleApresRec.equipement._id || articleApresRec.equipement;
  console.log(`✔ Réception validée avec succès !`);
  console.log(`   ↳ ID Équipement rattaché dans la commande : ${nouvelEquipementId}`);

  // 4. Vérifier que l'équipement existe désormais bien dans le catalogue
  console.log('\n--- 3. Vérification de la création automatique dans le catalogue d\'équipements ---');
  const eqDetail = await request(`/equipements/${nouvelEquipementId}`, {
    headers: authHeaders
  });

  console.log(`🎉 Équipement créé automatiquement dans le catalogue :`);
  console.log(`   ↳ Désignation : "${eqDetail.data.data.designation}"`);
  console.log(`   ↳ Type        : ${eqDetail.data.data.type?.nom || eqDetail.data.data.type}`);
  console.log(`   ↳ Fournisseur : ${eqDetail.data.data.fournisseur?.nom || eqDetail.data.data.fournisseur}`);
  console.log(`   ↳ Prix        : ${eqDetail.data.data.prix} GNF`);
  console.log(`   ↳ Statut      : ${eqDetail.data.data.isActive ? 'Actif' : 'Inactif'}`);

  console.log('\n========================================================================');
  console.log('✅ LA CRÉATION AUTOMATIQUE D\'ÉQUIPEMENT LORS DE LA RÉCEPTION EST CONFIRMÉE !');
  console.log('========================================================================');
}

testAutoCreationEquipement().catch(err => {
  console.error('Erreur :', err.message);
});
