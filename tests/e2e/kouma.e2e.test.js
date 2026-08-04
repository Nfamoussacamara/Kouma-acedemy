import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import argon2 from 'argon2';
import { createApp } from '../../src/app.js';
import { UserModel } from '../../src/modules/user/infrastructure/persistence/models/User.model.js';
import { FournisseurModel } from '../../src/modules/fournisseur/infrastructure/persistence/models/Fournisseur.model.js';
import { EquipementModel } from '../../src/modules/equipement/infrastructure/persistence/models/Equipement.model.js';
import {
  setupTestDatabase,
  teardownTestDatabase,
  clearDatabase,
} from '../helpers/mongo.js';

describe('KOUMA ACADEMY SAS (E2E Tests Phase 1)', () => {
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

    // 2. Se connecter pour obtenir le token d'accès administratreur
    const loginRes = await app.post('/api/v1/auth/login').send({
      username: 'admin',
      password: 'adminPassword123',
    });

    assert.equal(loginRes.status, 200);
    const token = loginRes.body.data.accessToken;
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
      assert.equal(res.body.data.password, undefined); // non retourné
    });

    it('La connexion d\'un utilisateur créé fonctionne et retourne des tokens valides', async () => {
      // Enregistrer l'utilisateur standard
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

      // Valider le login
      const loginRes = await app.post('/api/v1/auth/login').send({
        username: 'MOUSSA', // case-insensitive
        password: 'password123',
      });

      assert.equal(loginRes.status, 200);
      assert.ok(loginRes.body.data.accessToken);
      assert.ok(loginRes.body.data.refreshToken);
      assert.equal(loginRes.body.data.user.username, 'moussa');
    });

    it('Un compte désactivé (isActive = false) ne peut plus se connecter', async () => {
      // 1. Enregistrer un utilisateur standard
      const regRes = await app
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
      const userId = regRes.body.data.id;

      // 2. Désactiver le compte
      const statusRes = await app
        .patch(`/api/v1/users/${userId}/status`)
        .set(adminHeaders)
        .send({ isActive: false });

      assert.equal(statusRes.status, 200);
      assert.equal(statusRes.body.data.isActive, false);

      // 3. Essayer de se connecter
      const loginRes = await app.post('/api/v1/auth/login').send({
        username: 'moussa',
        password: 'password123',
      });

      assert.equal(loginRes.status, 401);
      assert.match(loginRes.body.error.message, /désactivé/);
    });

    it('Changement de mot de passe personnel + vérification après connexion', async () => {
      // Enregistrer l'utilisateur standard
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

      // Login pour choper le token standard
      const loginRes = await app.post('/api/v1/auth/login').send({
        username: 'moussa',
        password: 'password123',
      });
      const userToken = loginRes.body.data.accessToken;
      const userHeaders = { Authorization: `Bearer ${userToken}` };

      // Modifier le mot de passe
      const pwdRes = await app
        .patch('/api/v1/users/me/password')
        .set(userHeaders)
        .send({
          oldPassword: 'password123',
          newPassword: 'newSecurePassword321',
        });
      assert.equal(pwdRes.status, 200);

      // Reconnexion avec l'ancien mot de passe -> Doit échouer (401)
      const oldLogin = await app.post('/api/v1/auth/login').send({
        username: 'moussa',
        password: 'password123',
      });
      assert.equal(oldLogin.status, 401);

      // Reconnexion avec le nouveau mot de passe -> Doit réussir (200)
      const newLogin = await app.post('/api/v1/auth/login').send({
        username: 'moussa',
        password: 'newSecurePassword321',
      });
      assert.equal(newLogin.status, 200);
    });

    it('Un utilisateur standard est bloqué s\'il tente de modifier son type ou isActive', async () => {
      // 1. Créer le compte standard
      const regRes = await app
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
      const userId = regRes.body.data.id;

      // 2. Login pour choper le token standard
      const loginRes = await app.post('/api/v1/auth/login').send({
        username: 'moussa',
        password: 'password123',
      });
      const userToken = loginRes.body.data.accessToken;
      const userHeaders = { Authorization: `Bearer ${userToken}` };

      // 3. Tenter de modifier le type via PATCH /users/:id
      const patchRes = await app
        .patch(`/api/v1/users/${userId}`)
        .set(userHeaders)
        .send({
          nom: 'Modifie Nom',
          type: 'Admin',
          isActive: false,
        });

      assert.equal(patchRes.status, 200);
      // Le nom doit changer, mais type et isActive restent inchangés (ignorigés silencieusement)
      assert.equal(patchRes.body.data.nom, 'Modifie Nom');
      assert.equal(patchRes.body.data.type, 'Utilisateur');
      assert.equal(patchRes.body.data.isActive, true);
    });
  });

  describe('Module 2 & 3: Fournisseurs & Équipements', () => {
    let supplierId;
    let userHeaders;

    beforeEach(async () => {
      // Créer un utilisateur standard pour tester les restrictions RBAC
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
        username: 'moussa',
        password: 'password123',
      });
      userHeaders = { Authorization: `Bearer ${loginRes.body.data.accessToken}` };

      // Créer un fournisseur initial par l'Admin
      const supplierRes = await app
        .post('/api/v1/fournisseurs')
        .set(adminHeaders)
        .send({
          nom: 'SOGUIBE SRL',
          contact: 'soguibe@mail.gn',
          adresse: 'Conakry, GN',
        });
      supplierId = supplierRes.body.data.id;
    });

    it('Règle RBAC: Écritures fournisseurs réservées Admin, lecture ouverte à tous', async () => {
      // Un standard tente de créer un fournisseur -> 403
      const createFail = await app
        .post('/api/v1/fournisseurs')
        .set(userHeaders)
        .send({ nom: 'Fail', contact: '00' });
      assert.equal(createFail.status, 403);

      // Un standard consulte les fournisseurs -> 200
      const readRes = await app.get('/api/v1/fournisseurs').set(userHeaders);
      assert.equal(readRes.status, 200);
      assert.equal(readRes.body.data.length, 1);
    });

    it('Calcul automatique du montant fournisseur lors du cycle de vie des équipements', async () => {
      // 1. Ajouter un équipement unique lié de prix 500.00 par admin
      const eq1Res = await app
        .post('/api/v1/equipements')
        .set(adminHeaders)
        .send({
          designation: 'Ordinateur Portable Dell',
          type: 'Informatique',
          fournisseur: supplierId,
          prix: 500,
          caracteristique: 'RAM 16GB, SSD 512GB',
        });
      assert.equal(eq1Res.status, 201);
      const eq1Id = eq1Res.body.data.id;

      // Le montant du fournisseur doit être égal à 500
      let supplier = await app.get(`/api/v1/fournisseurs/${supplierId}`).set(userHeaders);
      assert.equal(supplier.body.data.montant, 500);

      // 2. Ajouter un second équipement lié de prix 1500.00
      const eq2Res = await app
        .post('/api/v1/equipements')
        .set(adminHeaders)
        .send({
          designation: 'Serveur de Stockage NAS',
          type: 'Informatique',
          fournisseur: supplierId,
          prix: 1500,
        });
      assert.equal(eq2Res.status, 201);
      const eq2Id = eq2Res.body.data.id;

      // Le montant cumulé du fournisseur doit être 2000
      supplier = await app.get(`/api/v1/fournisseurs/${supplierId}`).set(userHeaders);
      assert.equal(supplier.body.data.montant, 2000);

      // 3. Modifier le prix de l'équipement 2 à 2500
      const updateRes = await app
        .patch(`/api/v1/equipements/${eq2Id}`)
        .set(adminHeaders)
        .send({ prix: 2500 });
      assert.equal(updateRes.status, 200);

      // Le montant fournisseur doit se réajuster à 3000
      supplier = await app.get(`/api/v1/fournisseurs/${supplierId}`).set(userHeaders);
      assert.equal(supplier.body.data.montant, 3000);

      // 4. Supprimer logicallement l'équipement 1 (isActive -> false)
      const deleteEqRes = await app.delete(`/api/v1/equipements/${eq1Id}`).set(adminHeaders);
      assert.equal(deleteEqRes.status, 204);

      // Le montant fournisseur ne doit plus compter l'équipement 1 (3000 - 500 = 2500)
      supplier = await app.get(`/api/v1/fournisseurs/${supplierId}`).set(userHeaders);
      assert.equal(supplier.body.data.montant, 2500);
    });

    it('Règle anti-suppression: Un fournisseur lié à des équipements encore actifs ne peut être supprimé', async () => {
      // 1. Lier un équipement actif au fournisseur
      await app
        .post('/api/v1/equipements')
        .set(adminHeaders)
        .send({
          designation: 'Routeur Cisco',
          type: 'Réseau',
          fournisseur: supplierId,
          prix: 1000,
        });

      // 2. Tenter de supprimer le fournisseur -> Conflit (409)
      const deleteSupRes = await app.delete(`/api/v1/fournisseurs/${supplierId}`).set(adminHeaders);
      assert.equal(deleteSupRes.status, 409);
      assert.match(deleteSupRes.body.error.message, /équipements/);
    });

    it('Recalcul des montants en cas de transfert d\'équipement vers un autre fournisseur', async () => {
      // 1. Créer un second fournisseur
      const sup2Res = await app
        .post('/api/v1/fournisseurs')
        .set(adminHeaders)
        .send({ nom: 'FOYER S.A.', contact: 'foyer@mail.gn' });
      const supplierId2 = sup2Res.body.data.id;

      // 2. Créer un équipement lié au fournisseur 1 de prix 800
      const eqRes = await app
        .post('/api/v1/equipements')
        .set(adminHeaders)
        .send({
          designation: 'Onduleur APC',
          type: 'Énergie',
          fournisseur: supplierId,
          prix: 800,
        });
      const eqId = eqRes.body.data.id;

      // Vérifier les montants
      let sup1 = await app.get(`/api/v1/fournisseurs/${supplierId}`).set(userHeaders);
      let sup2 = await app.get(`/api/v1/fournisseurs/${supplierId2}`).set(userHeaders);
      assert.equal(sup1.body.data.montant, 800);
      assert.equal(sup2.body.data.montant, 0);

      // 3. Transférer l'équipement vers le fournisseur 2
      const transferRes = await app
        .patch(`/api/v1/equipements/${eqId}`)
        .set(adminHeaders)
        .send({ fournisseur: supplierId2 });
      assert.equal(transferRes.status, 200);

      // Vérifier les montants recalculés des deux fournisseurs
      sup1 = await app.get(`/api/v1/fournisseurs/${supplierId}`).set(userHeaders);
      sup2 = await app.get(`/api/v1/fournisseurs/${supplierId2}`).set(userHeaders);
      assert.equal(sup1.body.data.montant, 0);
      assert.equal(sup2.body.data.montant, 800);
    });
  });
});
