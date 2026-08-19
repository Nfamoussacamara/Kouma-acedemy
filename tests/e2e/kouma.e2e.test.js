import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import config from '../../src/config/index.js';
import { createApp } from '../../src/app.js';
import { UserModel } from '../../src/modules/user/infrastructure/persistence/models/User.model.js';
import {
  setupTestDatabase,
  teardownTestDatabase,
  clearDatabase,
} from '../helpers/mongo.js';

describe('KOUMA ACADEMY SAS - Suite Complète de Tests E2E', () => {
  /** @type {import('supertest').Agent} */
  let app;
  let adminHeaders;
  let adminId;

  before(async () => {
    await setupTestDatabase();
    app = request(createApp());
  });

  after(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();

    // 1. Insérer un compte administrateur initial
    const hashedPassword = await argon2.hash('adminPassword123');
    const adminUser = await UserModel.create({
      username: 'admin',
      password: hashedPassword,
      nom: 'Diallo',
      prenom: 'Alseyni',
      tel: '+224622000000',
      type: 'Admin',
      isActive: true,
    });
    adminId = adminUser._id.toString();

    // 2. Générer le token JWT admin
    const token = jwt.sign(
      {
        id: adminId,
        username: adminUser.username,
        type: adminUser.type,
      },
      config.jwtSecret,
      { expiresIn: '15m' }
    );
    adminHeaders = { Authorization: `Bearer ${token}` };
  });

  describe('Module 1: Authentification & Utilisateurs', () => {
    it('L\'administrateur réclame la création d\'un utilisateur standard', async () => {
      const res = await app
        .post('/api/v1/auth/register')
        .set(adminHeaders)
        .send({
          username: 'moussa',
          password: 'password123',
          nom: 'Camara',
          prenom: 'Moussa',
          tel: '+224625515151',
          type: 'Utilisateur',
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.username, 'moussa');
      assert.equal(res.body.data.type, 'Utilisateur');
      assert.ok(res.body.data._id);
    });

    it('La connexion d\'un utilisateur créé fonctionne et retourne des tokens valides', async () => {
      await app
        .post('/api/v1/auth/register')
        .set(adminHeaders)
        .send({
          username: 'moussa',
          password: 'password123',
          nom: 'Camara',
          prenom: 'Moussa',
          tel: '+224625515151',
          type: 'Utilisateur',
        });

      const loginRes = await app.post('/api/v1/auth/login').send({
        username: 'MOUSSA',
        password: 'password123',
      });

      assert.equal(loginRes.status, 200);
      assert.ok(loginRes.body.data.accessToken);
      assert.ok(loginRes.body.data.refreshToken);
      assert.equal(loginRes.body.data.user.username, 'moussa');
    });

    it('Un compte désactivé (isActive = false) ne peut plus se connecter', async () => {
      const regRes = await app
        .post('/api/v1/auth/register')
        .set(adminHeaders)
        .send({
          username: 'moussa_inactive',
          password: 'password123',
          nom: 'Camara',
          prenom: 'Moussa',
          tel: '+224625515151',
          type: 'Utilisateur',
        });
      const userId = regRes.body.data._id;

      const statusRes = await app
        .patch(`/api/v1/users/${userId}/status`)
        .set(adminHeaders)
        .send({ isActive: false });

      assert.equal(statusRes.status, 200);
      assert.equal(statusRes.body.success, true);

      const loginRes = await app.post('/api/v1/auth/login').send({
        username: 'moussa_inactive',
        password: 'password123',
      });

      assert.equal(loginRes.status, 401);
      assert.match(loginRes.body.error.message, /désactivé/);
    });

    it('Changement de mot de passe personnel + vérification après connexion', async () => {
      const regRes = await app
        .post('/api/v1/auth/register')
        .set(adminHeaders)
        .send({
          username: 'moussa_pwd',
          password: 'password123',
          nom: 'Camara',
          prenom: 'Moussa',
          tel: '+224625515151',
          type: 'Utilisateur',
        });
      const userId = regRes.body.data._id;

      const userToken = jwt.sign(
        { id: userId, username: 'moussa_pwd', type: 'Utilisateur' },
        config.jwtSecret,
        { expiresIn: '15m' }
      );
      const userHeaders = { Authorization: `Bearer ${userToken}` };

      const pwdRes = await app
        .patch('/api/v1/users/me/password')
        .set(userHeaders)
        .send({
          oldPassword: 'password123',
          newPassword: 'newSecurePassword321',
        });
      assert.equal(pwdRes.status, 200);

      const oldLogin = await app.post('/api/v1/auth/login').send({
        username: 'moussa_pwd',
        password: 'password123',
      });
      assert.equal(oldLogin.status, 401);

      const newLogin = await app.post('/api/v1/auth/login').send({
        username: 'moussa_pwd',
        password: 'newSecurePassword321',
      });
      assert.equal(newLogin.status, 200);
    });

    it('Un utilisateur standard modifie son profil mais ne peut pas altérer type ou statut', async () => {
      const regRes = await app
        .post('/api/v1/auth/register')
        .set(adminHeaders)
        .send({
          username: 'moussa_profile',
          password: 'password123',
          nom: 'Camara',
          prenom: 'Moussa',
          tel: '+224625515151',
          type: 'Utilisateur',
        });
      const userId = regRes.body.data._id.toString();

      const userToken = jwt.sign(
        { id: userId, username: 'moussa_profile', type: 'Utilisateur' },
        config.jwtSecret,
        { expiresIn: '15m' }
      );
      const userHeaders = { Authorization: `Bearer ${userToken}` };

      const patchRes = await app
        .patch(`/api/v1/users/${userId}`)
        .set(userHeaders)
        .send({
          nom: 'Modifie Nom',
          type: 'Admin',
          isActive: false,
        });

      assert.equal(patchRes.status, 200);
      assert.equal(patchRes.body.data.nom, 'Modifie Nom');
      assert.equal(patchRes.body.data.type, 'Utilisateur');
      assert.equal(patchRes.body.data.isActive, true);
    });
  });

  describe('Module 2: Fournisseurs', () => {
    let supplierId;
    let typeEquipementId;
    let userHeaders;

    beforeEach(async () => {
      const standardUser = await UserModel.create({
        username: 'moussa_fournisseur',
        password: await argon2.hash('password123'),
        nom: 'Camara',
        prenom: 'Moussa',
        tel: '+224625515151',
        type: 'Utilisateur',
        isActive: true,
      });
      const userToken = jwt.sign(
        { id: standardUser._id.toString(), username: standardUser.username, type: standardUser.type },
        config.jwtSecret,
        { expiresIn: '15m' }
      );
      userHeaders = { Authorization: `Bearer ${userToken}` };

      const typeRes = await app
        .post('/api/v1/type-equipements')
        .set(adminHeaders)
        .send({ nom: 'Informatique', description: 'Matériel IT' });
      typeEquipementId = typeRes.body.data._id;

      const supplierRes = await app
        .post('/api/v1/fournisseurs')
        .set(adminHeaders)
        .send({ nom: 'SOGUIBE SRL', contact: 'soguibe@mail.gn', adresse: 'Conakry, GN' });
      supplierId = supplierRes.body.data._id;
    });

    it('RBAC : écriture réservée Admin, lecture ouverte à tous', async () => {
      const createFail = await app
        .post('/api/v1/fournisseurs')
        .set(userHeaders)
        .send({ nom: 'Fail', contact: '00' });
      assert.equal(createFail.status, 403);

      const readRes = await app.get('/api/v1/fournisseurs').set(userHeaders);
      assert.equal(readRes.status, 200);
      assert.equal(readRes.body.data.length, 1);
    });

    it('CRUD : lecture par ID, mise à jour adresse et contact', async () => {
      const getRes = await app.get(`/api/v1/fournisseurs/${supplierId}`).set(userHeaders);
      assert.equal(getRes.status, 200);
      assert.equal(getRes.body.data.nom, 'SOGUIBE SRL');
      assert.equal(getRes.body.data.montant, 0);

      const patchRes = await app
        .patch(`/api/v1/fournisseurs/${supplierId}`)
        .set(adminHeaders)
        .send({ adresse: 'Kaloum, Conakry', contact: 'nouveau@soguibe.gn' });
      assert.equal(patchRes.status, 200);
      assert.equal(patchRes.body.data.adresse, 'Kaloum, Conakry');
    });

    it('Règle anti-suppression : fournisseur avec équipements actifs → 409', async () => {
      await app.post('/api/v1/equipements').set(adminHeaders).send({
        designation: 'Routeur Cisco', type: typeEquipementId, fournisseur: supplierId, prix: 1000,
      });
      const deleteRes = await app.delete(`/api/v1/fournisseurs/${supplierId}`).set(adminHeaders);
      assert.equal(deleteRes.status, 409);
      assert.match(deleteRes.body.error.message, /équipements/);
    });

    it('Suppression d\'un fournisseur sans équipements actifs → succès', async () => {
      const sup2Res = await app
        .post('/api/v1/fournisseurs')
        .set(adminHeaders)
        .send({ nom: 'VIDE SARL', contact: 'vide@mail.gn' });
      const idVide = sup2Res.body.data._id;
      const deleteRes = await app.delete(`/api/v1/fournisseurs/${idVide}`).set(adminHeaders);
      assert.equal(deleteRes.status, 200);
    });

    it('Fournisseur inexistant → 404', async () => {
      const getRes = await app.get('/api/v1/fournisseurs/000000000000000000000001').set(userHeaders);
      assert.equal(getRes.status, 404);
    });
  });

  describe('Module 3: Équipements', () => {
    let supplierId;
    let supplierId2;
    let typeEquipementId;
    let userHeaders;

    beforeEach(async () => {
      const standardUser = await UserModel.create({
        username: 'kane_equipement',
        password: await argon2.hash('password123'),
        nom: 'Kane',
        prenom: 'Ibrahima',
        tel: '+224628888888',
        type: 'Utilisateur',
        isActive: true,
      });
      const userToken = jwt.sign(
        { id: standardUser._id.toString(), username: standardUser.username, type: standardUser.type },
        config.jwtSecret,
        { expiresIn: '15m' }
      );
      userHeaders = { Authorization: `Bearer ${userToken}` };

      const typeRes = await app
        .post('/api/v1/type-equipements')
        .set(adminHeaders)
        .send({ nom: 'Réseau', description: 'Équipements réseau' });
      typeEquipementId = typeRes.body.data._id;

      const sup1 = await app
        .post('/api/v1/fournisseurs')
        .set(adminHeaders)
        .send({ nom: 'FOYER TECH', contact: 'tech@foyer.gn' });
      supplierId = sup1.body.data._id;

      const sup2 = await app
        .post('/api/v1/fournisseurs')
        .set(adminHeaders)
        .send({ nom: 'ALPHA SYSTEMS', contact: 'alpha@systems.gn' });
      supplierId2 = sup2.body.data._id;
    });

    it('CRUD complet : création avec modèle, lecture par ID, mise à jour désignation/prix', async () => {
      const createRes = await app
        .post('/api/v1/equipements')
        .set(adminHeaders)
        .send({
          designation: 'Switch HP ProCurve 24 ports',
          type: typeEquipementId,
          fournisseur: supplierId,
          modele: 'J9623A',
          caracteristique: '24 ports Gigabit, PoE+',
          prix: 850,
        });
      assert.equal(createRes.status, 201);
      assert.equal(createRes.body.data.designation, 'Switch HP ProCurve 24 ports');
      assert.equal(createRes.body.data.prix, 850);
      assert.equal(createRes.body.data.isActive, true);
      const eqId = createRes.body.data._id;

      // Lecture par ID : vérification complète incluant modèle et fournisseur
      const getRes = await app.get(`/api/v1/equipements/${eqId}`).set(userHeaders);
      assert.equal(getRes.status, 200);
      assert.equal(getRes.body.data._id, eqId);
      assert.ok(getRes.body.data.fournisseur);

      const patchRes = await app
        .patch(`/api/v1/equipements/${eqId}`)
        .set(adminHeaders)
        .send({ designation: 'Switch HP ProCurve 24 ports v2', prix: 900 });
      assert.equal(patchRes.status, 200);
      assert.equal(patchRes.body.data.designation, 'Switch HP ProCurve 24 ports v2');
      assert.equal(patchRes.body.data.prix, 900);
    });

    it('RBAC : création interdite aux utilisateurs standard → 403', async () => {
      const failRes = await app
        .post('/api/v1/equipements')
        .set(userHeaders)
        .send({ designation: 'Test', type: typeEquipementId, prix: 100 });
      assert.equal(failRes.status, 403);
    });

    it('Validation : champs requis manquants → 400', async () => {
      const noDesig = await app
        .post('/api/v1/equipements')
        .set(adminHeaders)
        .send({ type: typeEquipementId, prix: 100 });
      assert.equal(noDesig.status, 400);

      const noType = await app
        .post('/api/v1/equipements')
        .set(adminHeaders)
        .send({ designation: 'Test sans type', prix: 100 });
      assert.equal(noType.status, 400);

      const noPrix = await app
        .post('/api/v1/equipements')
        .set(adminHeaders)
        .send({ designation: 'Test sans prix', type: typeEquipementId });
      assert.equal(noPrix.status, 400);
    });

    it('Validation : fournisseur inexistant lors de la création → 404', async () => {
      const res = await app
        .post('/api/v1/equipements')
        .set(adminHeaders)
        .send({ designation: 'Fantôme', type: typeEquipementId, fournisseur: '000000000000000000000099', prix: 200 });
      assert.equal(res.status, 404);
    });

    it('Équipement inexistant → 404', async () => {
      const res = await app.get('/api/v1/equipements/000000000000000000000001').set(userHeaders);
      assert.equal(res.status, 404);
    });

    it('Calcul automatique du montant fournisseur lors du cycle de vie des équipements', async () => {
      const eq1 = await app.post('/api/v1/equipements').set(adminHeaders).send({
        designation: 'Ordinateur Dell', type: typeEquipementId, fournisseur: supplierId, prix: 500,
      });
      const eq1Id = eq1.body.data._id;

      let sup = await app.get(`/api/v1/fournisseurs/${supplierId}`).set(userHeaders);
      assert.equal(sup.body.data.montant, 500);

      const eq2 = await app.post('/api/v1/equipements').set(adminHeaders).send({
        designation: 'Serveur NAS', type: typeEquipementId, fournisseur: supplierId, prix: 1500,
      });
      const eq2Id = eq2.body.data._id;

      sup = await app.get(`/api/v1/fournisseurs/${supplierId}`).set(userHeaders);
      assert.equal(sup.body.data.montant, 2000);

      await app.patch(`/api/v1/equipements/${eq2Id}`).set(adminHeaders).send({ prix: 2500 });
      sup = await app.get(`/api/v1/fournisseurs/${supplierId}`).set(userHeaders);
      assert.equal(sup.body.data.montant, 3000);

      const delRes = await app.delete(`/api/v1/equipements/${eq1Id}`).set(adminHeaders);
      assert.equal(delRes.status, 204);
      sup = await app.get(`/api/v1/fournisseurs/${supplierId}`).set(userHeaders);
      assert.equal(sup.body.data.montant, 2500);
    });

    it('Transfert d\'équipement vers un autre fournisseur → recalcul des deux montants', async () => {
      const eqRes = await app.post('/api/v1/equipements').set(adminHeaders).send({
        designation: 'Onduleur APC', type: typeEquipementId, fournisseur: supplierId, prix: 800,
      });
      const eqId = eqRes.body.data._id;

      let sup1 = await app.get(`/api/v1/fournisseurs/${supplierId}`).set(userHeaders);
      let sup2 = await app.get(`/api/v1/fournisseurs/${supplierId2}`).set(userHeaders);
      assert.equal(sup1.body.data.montant, 800);
      assert.equal(sup2.body.data.montant, 0);

      const transferRes = await app
        .patch(`/api/v1/equipements/${eqId}`)
        .set(adminHeaders)
        .send({ fournisseur: supplierId2 });
      assert.equal(transferRes.status, 200);

      sup1 = await app.get(`/api/v1/fournisseurs/${supplierId}`).set(userHeaders);
      sup2 = await app.get(`/api/v1/fournisseurs/${supplierId2}`).set(userHeaders);
      assert.equal(sup1.body.data.montant, 0);
      assert.equal(sup2.body.data.montant, 800);
    });

    it('Désactivation et réactivation (PATCH /:id/status)', async () => {
      const eqRes = await app.post('/api/v1/equipements').set(adminHeaders).send({
        designation: 'Écran Samsung 27"', type: typeEquipementId, fournisseur: supplierId, prix: 320,
      });
      const eqId = eqRes.body.data._id;
      assert.equal(eqRes.body.data.isActive, true);

      const deactivate = await app
        .patch(`/api/v1/equipements/${eqId}/status`)
        .set(adminHeaders)
        .send({ isActive: false });
      assert.equal(deactivate.status, 200);

      const inactiveList = await app.get('/api/v1/equipements?status=inactive').set(userHeaders);
      assert.equal(inactiveList.status, 200);
      assert.ok(inactiveList.body.data.some(e => e._id === eqId));

      const reactivate = await app
        .patch(`/api/v1/equipements/${eqId}/status`)
        .set(adminHeaders)
        .send({ isActive: true });
      assert.equal(reactivate.status, 200);

      const activeList = await app.get('/api/v1/equipements?status=active').set(userHeaders);
      assert.ok(activeList.body.data.some(e => e._id === eqId));
    });

    it('Filtres de liste : par type, par fournisseur, par recherche textuelle', async () => {
      const type2Res = await app
        .post('/api/v1/type-equipements')
        .set(adminHeaders)
        .send({ nom: 'Médical', description: 'Équipements médicaux' });
      const typeId2 = type2Res.body.data._id;

      await app.post('/api/v1/equipements').set(adminHeaders).send({
        designation: 'Câble RJ45', type: typeEquipementId, fournisseur: supplierId, prix: 10,
      });
      await app.post('/api/v1/equipements').set(adminHeaders).send({
        designation: 'Tensiomètre numérique', type: typeId2, fournisseur: supplierId2, prix: 75,
      });

      const byType = await app.get(`/api/v1/equipements?type=${typeEquipementId}`).set(userHeaders);
      assert.equal(byType.status, 200);
      assert.ok(byType.body.data.length >= 1);

      const byFour = await app.get(`/api/v1/equipements?fournisseur=${supplierId2}`).set(userHeaders);
      assert.equal(byFour.status, 200);
      assert.ok(byFour.body.data.length >= 1);

      const bySearch = await app.get('/api/v1/equipements?search=Tensiom').set(userHeaders);
      assert.equal(bySearch.status, 200);
      assert.ok(bySearch.body.data.some(e => e.designation.includes('Tensiomètre')));
    });

    it('Suppression logique → équipement introuvable après', async () => {
      const eqRes = await app.post('/api/v1/equipements').set(adminHeaders).send({
        designation: 'Clé USB 128Go', type: typeEquipementId, fournisseur: supplierId, prix: 15,
      });
      const eqId = eqRes.body.data._id;

      const delRes = await app.delete(`/api/v1/equipements/${eqId}`).set(adminHeaders);
      assert.equal(delRes.status, 204);

      const getRes = await app.get(`/api/v1/equipements/${eqId}`).set(userHeaders);
      assert.equal(getRes.status, 404);
    });

    it('Double suppression d\'un équipement → 404', async () => {
      const eqRes = await app.post('/api/v1/equipements').set(adminHeaders).send({
        designation: 'Hub USB 4 ports', type: typeEquipementId, fournisseur: supplierId, prix: 25,
      });
      const eqId = eqRes.body.data._id;
      await app.delete(`/api/v1/equipements/${eqId}`).set(adminHeaders);
      const del2 = await app.delete(`/api/v1/equipements/${eqId}`).set(adminHeaders);
      assert.equal(del2.status, 404);
    });
  });

  describe('Module 4: Pannes', () => {

    let typeEquipementId;

    beforeEach(async () => {
      const typeRes = await app
        .post('/api/v1/type-equipements')
        .set(adminHeaders)
        .send({ nom: 'Informatique Test', description: 'Pour tests pannes' });
      typeEquipementId = typeRes.body.data._id;
    });

    it('Récupération des options pour le formulaire dynamique frontend', async () => {
      const res = await app.get('/api/v1/pannes/options').set(adminHeaders);
      assert.equal(res.status, 200);
      assert.ok(res.body.data.types_panne.includes('Équipement'));
      assert.ok(res.body.data.types_panne.includes('Espace/Système'));
      assert.ok(res.body.data.niveaux_urgence.includes('Critique'));
      assert.ok(res.body.data.systemes.includes('BE'));
    });

    it('Création panne type Équipement — article hors catalogue (designation seule)', async () => {
      const createRes = await app
        .post('/api/v1/pannes')
        .set(adminHeaders)
        .send({
          description: 'Écran du moniteur principal scintille',
          type_panne: 'Équipement',
          equipements: [
            {
              designation: 'Moniteur Dell 24 pouces',
              quantite: 1,
              modele: 'P2419H',
            },
          ],
          cause: 'Câble HDMI défectueux',
          niveau_urgence: 'Critique',
          impact_services: ['Un service complet'],
          tentatives_realisees: ['Reconnexion', 'Redémarrage des équipements'],
          besoin_intervention: true,
        });

      assert.equal(createRes.status, 201);
      assert.equal(createRes.body.data.statut, 'NOUVELLE');
      assert.ok(Array.isArray(createRes.body.data.equipements));
      assert.equal(createRes.body.data.equipements.length, 1);
      assert.equal(createRes.body.data.equipements[0].designation, 'Moniteur Dell 24 pouces');
      assert.equal(createRes.body.data.equipements[0].modele, 'P2419H');
      assert.equal(createRes.body.data.equipements[0].quantite, 1);
    });

    it('Création panne type Équipement — article lié au catalogue', async () => {
      // Créer un fournisseur et un équipement catalogue d'abord
      const supRes = await app
        .post('/api/v1/fournisseurs')
        .set(adminHeaders)
        .send({ nom: 'Techno Guinée', contact: '628000001' });
      const supplierId = supRes.body.data._id;

      const eqRes = await app
        .post('/api/v1/equipements')
        .set(adminHeaders)
        .send({
          designation: 'Imprimante HP LaserJet Pro',
          type: typeEquipementId,
          fournisseur: supplierId,
          modele: 'M404dn',
          prix: 250,
        });
      assert.equal(eqRes.status, 201);
      const eqId = eqRes.body.data._id;

      const createRes = await app
        .post('/api/v1/pannes')
        .set(adminHeaders)
        .send({
          description: 'Imprimante ne répond plus',
          type_panne: 'Équipement',
          equipements: [
            {
              equipement: eqId,
              designation: 'Imprimante HP LaserJet Pro',
              quantite: 1,
              modele: 'M404dn',
            },
          ],
          niveau_urgence: 'Moyen',
          impact_services: ['Aucun impact'],
          besoin_intervention: false,
        });

      assert.equal(createRes.status, 201);
      assert.ok(Array.isArray(createRes.body.data.equipements));
      // L'équipement est lié et populé
      assert.ok(
        createRes.body.data.equipements[0].equipement !== null
      );
    });

    it('Validation : équipement catalogue avec ID inexistant → 404', async () => {
      const fakeId = '000000000000000000000099';
      const createRes = await app
        .post('/api/v1/pannes')
        .set(adminHeaders)
        .send({
          description: 'Test erreur ID inconnu',
          type_panne: 'Équipement',
          equipements: [{ equipement: fakeId, designation: 'Fantôme', quantite: 1 }],
          niveau_urgence: 'Faible',
          besoin_intervention: false,
        });

      assert.equal(createRes.status, 404);
    });

    it('Validation : panne type Équipement sans equipements → 400', async () => {
      const createRes = await app
        .post('/api/v1/pannes')
        .set(adminHeaders)
        .send({
          description: 'Test sans équipements',
          type_panne: 'Équipement',
          niveau_urgence: 'Critique',
          besoin_intervention: true,
        });

      assert.equal(createRes.status, 400);
    });

    it('Création panne Espace/Système + transition de statut + liste filtrée', async () => {
      const createRes = await app
        .post('/api/v1/pannes')
        .set(adminHeaders)
        .send({
          description: 'Serveur BE hors ligne',
          type_panne: 'Espace/Système',
          systeme: 'BE',
          cause: 'Surcharge réseau',
          niveau_urgence: 'Critique',
          impact_services: ['Un service complet'],
          tentatives_realisees: ['Redémarrage des équipements'],
          besoin_intervention: true,
        });

      assert.equal(createRes.status, 201);
      assert.equal(createRes.body.data.statut, 'NOUVELLE');
      const panneId = createRes.body.data._id;

      const getRes = await app.get(`/api/v1/pannes/${panneId}`).set(adminHeaders);
      assert.equal(getRes.status, 200);
      assert.equal(getRes.body.data._id, panneId);
      assert.ok(Array.isArray(getRes.body.data.commandes));
      assert.equal(getRes.body.data.equipements.length, 0);

      const updateStatutRes = await app
        .patch(`/api/v1/pannes/${panneId}/statut`)
        .set(adminHeaders)
        .send({ statut: 'en_cours' });

      assert.equal(updateStatutRes.status, 200);
      assert.equal(updateStatutRes.body.data.statut, 'EN_COURS');

      const listRes = await app.get('/api/v1/pannes?statut=en_cours').set(adminHeaders);
      assert.equal(listRes.status, 200);
      assert.ok(listRes.body.data.length >= 1);
    });

    it('Mise à jour d\'une panne — ajout de plusieurs équipements', async () => {
      const createRes = await app
        .post('/api/v1/pannes')
        .set(adminHeaders)
        .send({
          description: 'Panne multi-équipements initiale',
          type_panne: 'Équipement',
          equipements: [{ designation: 'Clavier USB', quantite: 2 }],
          niveau_urgence: 'Faible',
          besoin_intervention: false,
        });
      assert.equal(createRes.status, 201);
      const panneId = createRes.body.data._id;

      const updateRes = await app
        .patch(`/api/v1/pannes/${panneId}`)
        .set(adminHeaders)
        .send({
          equipements: [
            { designation: 'Clavier USB', quantite: 2 },
            { designation: 'Souris Logitech', quantite: 2, modele: 'MX Master 3' },
          ],
          cause: 'Défaillance périphériques',
          niveau_urgence: 'Moyen',
        });

      assert.equal(updateRes.status, 200);
      assert.equal(updateRes.body.data.equipements.length, 2);
      assert.equal(updateRes.body.data.niveau_urgence, 'Moyen');
    });
  });

  describe('Module 5: Commandes & Réceptions', () => {
    let supplierId;
    let panneId;
    let equipementId;

    beforeEach(async () => {
      const typeRes = await app
        .post('/api/v1/type-equipements')
        .set(adminHeaders)
        .send({ nom: 'Composants', description: 'Composants matériels' });
      const typeId = typeRes.body.data._id;

      const supRes = await app
        .post('/api/v1/fournisseurs')
        .set(adminHeaders)
        .send({ nom: 'GUINÉE TECH SA', contact: 'tech@guinee.gn' });
      supplierId = supRes.body.data._id;

      const eqRes = await app
        .post('/api/v1/equipements')
        .set(adminHeaders)
        .send({
          designation: 'Disque SSD 1TB Samsung',
          type: typeId,
          fournisseur: supplierId,
          prix: 120,
        });
      equipementId = eqRes.body.data._id;

      // Panne type Espace/Système (pas besoin de equipements)
      const panneRes = await app
        .post('/api/v1/pannes')
        .set(adminHeaders)
        .send({
          description: 'Panne serveur stockage',
          type_panne: 'Espace/Système',
          systeme: 'BE',
          niveau_urgence: 'Critique',
          besoin_intervention: true,
        });
      panneId = panneRes.body.data._id;
    });

    it('Cycle complet d\'une commande : Création, Réception partielle, Réception totale', async () => {
      const createRes = await app
        .post('/api/v1/commandes')
        .set(adminHeaders)
        .send({
          panne: panneId,
          fournisseur: supplierId,
          articles: [
            {
              equipement: equipementId,
              designation: 'Disque SSD 1TB Samsung',
              quantiteCommandee: 4,
              prixUnitaire: 120,
            },
          ],
        });

      assert.equal(createRes.status, 201);
      assert.match(createRes.body.data.numero, /^CMD-\d{8}-\d{4}$/);
      assert.equal(createRes.body.data.prixtotal, 480);
      assert.equal(createRes.body.data.status, 'BROUILLON');
      assert.equal(createRes.body.data.panne._id, panneId);
      const commandeId = createRes.body.data._id;

      // Vérifier que la panne liste bien cette commande rattachée
      const panneDetail = await app.get(`/api/v1/pannes/${panneId}`).set(adminHeaders);
      assert.equal(panneDetail.status, 200);
      assert.equal(panneDetail.body.data.commandes.length, 1);
      assert.equal(panneDetail.body.data.commandes[0]._id, commandeId);

      const recPartielleRes = await app
        .post(`/api/v1/commandes/${commandeId}/receptions`)
        .set(adminHeaders)
        .send({
          articlesRecus: [
            {
              equipement: equipementId,
              quantiteRecue: 2,
              prixUnitaire: 120,
            },
          ],
        });

      assert.equal(recPartielleRes.status, 200);
      assert.equal(recPartielleRes.body.data.status, 'PARTIELLEMENT_RECUE');
      assert.equal(recPartielleRes.body.data.articles[0].quantiteRecue, 2);

      const deleteFail = await app
        .delete(`/api/v1/commandes/${commandeId}`)
        .set(adminHeaders);
      assert.equal(deleteFail.status, 409);

      const recTotaleRes = await app
        .post(`/api/v1/commandes/${commandeId}/receptions`)
        .set(adminHeaders)
        .send({
          articlesRecus: [
            {
              equipement: equipementId,
              quantiteRecue: 2,
              prixUnitaire: 120,
            },
          ],
        });

      assert.equal(recTotaleRes.status, 200);
      assert.equal(recTotaleRes.body.data.status, 'RECUE');
      assert.equal(recTotaleRes.body.data.articles[0].quantiteRecue, 4);
    });

    it('Commande avec article hors catalogue → équipement créé automatiquement à la réception', async () => {
      const typeRes = await app
        .post('/api/v1/type-equipements')
        .set(adminHeaders)
        .send({ nom: 'Réseau', description: 'Équipements réseau' });
      const typeId = typeRes.body.data._id;

      const createRes = await app
        .post('/api/v1/commandes')
        .set(adminHeaders)
        .send({
          panne: panneId,
          fournisseur: supplierId,
          articles: [
            {
              typeEquipement: typeId,
              designation: 'Switch Cisco 24 ports',
              quantiteCommandee: 1,
              prixUnitaire: 450,
            },
          ],
        });

      assert.equal(createRes.status, 201);
      const commandeId = createRes.body.data._id;
      const articleEquipementAvant = createRes.body.data.articles[0].equipement;
      assert.equal(articleEquipementAvant, null);

      const recRes = await app
        .post(`/api/v1/commandes/${commandeId}/receptions`)
        .set(adminHeaders)
        .send({
          articlesRecus: [
            {
              typeEquipement: typeId,
              designation: 'Switch Cisco 24 ports',
              quantiteRecue: 1,
              prixUnitaire: 450,
            },
          ],
        });

      assert.equal(recRes.status, 200);
      assert.equal(recRes.body.data.status, 'RECUE');
      // L'équipement a été créé automatiquement et rattaché
      assert.ok(recRes.body.data.articles[0].equipement !== null);
    });

    it('Annulation d\'une commande vierge → statut ANNULEE', async () => {
      const createRes = await app
        .post('/api/v1/commandes')
        .set(adminHeaders)
        .send({
          panne: panneId,
          fournisseur: supplierId,
          articles: [
            {
              equipement: equipementId,
              designation: 'Disque SSD 1TB Samsung',
              quantiteCommandee: 2,
              prixUnitaire: 120,
            },
          ],
        });
      assert.equal(createRes.status, 201);
      const commandeId = createRes.body.data._id;

      const annulRes = await app
        .patch(`/api/v1/commandes/${commandeId}/status`)
        .set(adminHeaders)
        .send({ status: 'ANNULEE' });

      assert.equal(annulRes.status, 200);
      assert.equal(annulRes.body.data.status, 'ANNULEE');
    });
  });
});
