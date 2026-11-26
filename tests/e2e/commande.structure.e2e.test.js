import { describe, it, before, after, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import config from '../../src/config/index.js';
import { createApp } from '../../src/app.js';
import { UserModel } from '../../src/modules/user/infrastructure/persistence/models/User.model.js';
import { DocumentService } from '../../src/modules/commande/services/document.service.js';
import {
  setupTestDatabase,
  teardownTestDatabase,
  clearDatabase,
} from '../helpers/mongo.js';

describe('Commandes - Structure sanitaire, RBAC & Bon de réception signé (E2E)', () => {
  /** @type {import('supertest').Agent} */
  let app;
  let adminHeaders;
  let labeHeaders;
  let mamouHeaders;
  let labeUserId;
  let equipementId;

  const signHeaders = (user) => {
    const token = jwt.sign(
      {
        id: user._id.toString(),
        username: user.username,
        type: user.type,
        structure_sanitaire: user.structure_sanitaire,
      },
      config.jwtSecret,
      { expiresIn: '15m' }
    );
    return { Authorization: `Bearer ${token}` };
  };

  const registerReception = async (commandeId) => {
    const statusRes = await app
      .patch(`/api/v1/commandes/${commandeId}/status`)
      .set(adminHeaders)
      .send({ status: 'commandee' });
    assert.equal(statusRes.status, 200);

    const receptionRes = await app
      .post(`/api/v1/commandes/${commandeId}/receptions`)
      .set(adminHeaders)
      .send({
        equipementsRecus: [
          { equipement: equipementId, quantiteRecue: 1, prixUnitaire: 500000 },
        ],
      });
    assert.equal(receptionRes.status, 200);
  };

  before(async () => {
    await setupTestDatabase();
    app = request(createApp());
  });

  after(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    mock.restoreAll();

    const hashedPassword = await argon2.hash('password123');

    const [adminUser, labeUser, mamouUser] = await UserModel.create([
      {
        username: 'admin_test',
        password: hashedPassword,
        nom: 'Diallo',
        prenom: 'Admin',
        tel: '+224622000001',
        type: 'Admin',
        isActive: true,
      },
      {
        username: 'user_labe',
        password: hashedPassword,
        nom: 'Bah',
        prenom: 'Mamadou',
        tel: '+224622000002',
        type: 'Utilisateur',
        structure_sanitaire: 'HOPITAL REGIONAL DE LABE',
        isActive: true,
      },
      {
        username: 'user_mamou',
        password: hashedPassword,
        nom: 'Barry',
        prenom: 'Oumar',
        tel: '+224622000003',
        type: 'Utilisateur',
        structure_sanitaire: 'HOPITAL REGIONAL DE BOKE',
        isActive: true,
      },
    ]);

    labeUserId = labeUser._id.toString();
    adminHeaders = signHeaders(adminUser);
    labeHeaders = signHeaders(labeUser);
    mamouHeaders = signHeaders(mamouUser);

    const typeRes = await app
      .post('/api/v1/type-equipements')
      .set(adminHeaders)
      .send({ nom: 'Imagerie' });
    const typeId = typeRes.body.data._id;

    const fourRes = await app
      .post('/api/v1/fournisseurs')
      .set(adminHeaders)
      .send({ nom: 'Fournisseur Test', contact: 'test@fournisseur.gn' });
    const fournisseurId = fourRes.body.data._id;

    const eqRes = await app
      .post('/api/v1/equipements')
      .set(adminHeaders)
      .send({
        designation: 'Échographe Portable',
        type: typeId,
        fournisseur: fournisseurId,
        prix: 500000,
      });
    equipementId = eqRes.body.data._id;
  });

  it('1.1 Le backend marque la commande Admin comme créée pour sa structure', async () => {
    const res = await app
      .post('/api/v1/commandes')
      .set(adminHeaders)
      .send({
        structure_sanitaire: ['HOPITAL REGIONAL DE LABE'],
        equipements: [{ equipement: equipementId, quantiteCommandee: 2 }],
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.creeParAdmin, true);
    assert.deepEqual(res.body.data.structure_sanitaire, ['HOPITAL REGIONAL DE LABE']);
  });

  it('1.1 Sécurité: un Utilisateur ne peut pas forcer creeParAdmin ou structure_sanitaire à la création', async () => {
    const res = await app
      .post('/api/v1/commandes')
      .set(labeHeaders)
      .send({
        creeParAdmin: true,
        structure_sanitaire: ['HOPITAL REGIONAL DE BOKE'],
        equipements: [{ equipement: equipementId, quantiteCommandee: 1 }],
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.creeParAdmin, false);
    assert.deepEqual(res.body.data.structure_sanitaire, []);
    assert.equal(res.body.data.demandeur._id, labeUserId);
  });

  it('1.2 GET /commandes: un utilisateur voit ses commandes + celles creeParAdmin de sa structure uniquement', async () => {
    // Commande Admin pour Labé
    const cmdLabe = await app
      .post('/api/v1/commandes')
      .set(adminHeaders)
      .send({
        structure_sanitaire: ['HOPITAL REGIONAL DE LABE'],
        equipements: [{ equipement: equipementId, quantiteCommandee: 2 }],
      });

    // Commande Admin pour Mamou
    const cmdMamou = await app
      .post('/api/v1/commandes')
      .set(adminHeaders)
      .send({
        structure_sanitaire: ['HOPITAL REGIONAL DE BOKE'],
        equipements: [{ equipement: equipementId, quantiteCommandee: 3 }],
      });

    const listBeforeReception = await app.get('/api/v1/commandes').set(labeHeaders);
    assert.equal(listBeforeReception.status, 200);
    assert.ok(
      !listBeforeReception.body.data.some((c) => c._id === cmdLabe.body.data._id)
    );

    await registerReception(cmdLabe.body.data._id);
    await registerReception(cmdMamou.body.data._id);

    // Commande personnelle de l'utilisateur de Labé
    const cmdPersoLabe = await app
      .post('/api/v1/commandes')
      .set(labeHeaders)
      .send({
        equipements: [{ equipement: equipementId, quantiteCommandee: 1 }],
      });

    // Utilisateur de Labé (même en passant ?structure_sanitaire=MAMOU dans l'URL, le token fait foi)
    const listLabe = await app
      .get('/api/v1/commandes?structure_sanitaire=HOPITAL%20REGIONAL%20DE%20BOKE')
      .set(labeHeaders);

    assert.equal(listLabe.status, 200);
    const labeIds = listLabe.body.data.map((c) => c._id);
    assert.ok(labeIds.includes(cmdLabe.body.data._id));
    assert.ok(labeIds.includes(cmdPersoLabe.body.data._id));
    assert.ok(!labeIds.includes(cmdMamou.body.data._id));

    // Utilisateur de Mamou ne voit que la commande de Mamou
    const listMamou = await app.get('/api/v1/commandes').set(mamouHeaders);
    assert.equal(listMamou.status, 200);
    const mamouIds = listMamou.body.data.map((c) => c._id);
    assert.deepEqual(mamouIds, [cmdMamou.body.data._id]);

    // Admin peut filtrer par ?structure_sanitaire
    const listAdminFilter = await app
      .get('/api/v1/commandes?structure_sanitaire=HOPITAL%20REGIONAL%20DE%20LABE')
      .set(adminHeaders);
    assert.equal(listAdminFilter.status, 200);
    assert.deepEqual(
      listAdminFilter.body.data.map((c) => c._id),
      [cmdLabe.body.data._id]
    );
  });

  it('2. Recherche par référence dans la barre (?search=CMD-...)', async () => {
    const cmd = await app
      .post('/api/v1/commandes')
      .set(adminHeaders)
      .send({
        creeParAdmin: true,
        structure_sanitaire: ['HOPITAL REGIONAL DE LABE'],
        equipements: [{ equipement: equipementId, quantiteCommandee: 1 }],
      });
    const ref = cmd.body.data.reference;
    await registerReception(cmd.body.data._id);

    const searchRes = await app
      .get(`/api/v1/commandes?search=${encodeURIComponent(ref)}`)
      .set(labeHeaders);

    assert.equal(searchRes.status, 200);
    assert.equal(searchRes.body.data.length, 1);
    assert.equal(searchRes.body.data[0].reference, ref);
  });

  it('1.3 Droits d\'accès sur GET /:id, PATCH /:id et DELETE /:id', async () => {
    const cmdLabe = await app
      .post('/api/v1/commandes')
      .set(adminHeaders)
      .send({
        creeParAdmin: true,
        structure_sanitaire: ['HOPITAL REGIONAL DE LABE'],
        equipements: [{ equipement: equipementId, quantiteCommandee: 2 }],
      });
    const cmdId = cmdLabe.body.data._id;

    // La structure n'accède pas au détail avant la première réception.
    const getBeforeReception = await app
      .get(`/api/v1/commandes/${cmdId}`)
      .set(labeHeaders);
    assert.equal(getBeforeReception.status, 403);

    await registerReception(cmdId);

    // Membre de Labé -> 200
    const getLabe = await app.get(`/api/v1/commandes/${cmdId}`).set(labeHeaders);
    assert.equal(getLabe.status, 200);
    assert.equal(getLabe.body.data._id, cmdId);

    // Admin -> 200
    const getAdmin = await app.get(`/api/v1/commandes/${cmdId}`).set(adminHeaders);
    assert.equal(getAdmin.status, 200);

    // Utilisateur d'une autre structure -> 403
    const getMamou = await app.get(`/api/v1/commandes/${cmdId}`).set(mamouHeaders);
    assert.equal(getMamou.status, 403);

    // PATCH et DELETE restent réservés à l'Admin (403 même pour membre de la structure)
    const patchLabe = await app
      .patch(`/api/v1/commandes/${cmdId}`)
      .set(labeHeaders)
      .send({ equipements: [{ equipement: equipementId, quantiteCommandee: 5 }] });
    assert.equal(patchLabe.status, 403);

    const deleteLabe = await app.delete(`/api/v1/commandes/${cmdId}`).set(labeHeaders);
    assert.equal(deleteLabe.status, 403);
  });

  it('1.3 Upload et suppression de bonReceptionSigne (POST et DELETE /:id/bon-reception-signe)', async () => {
    mock.method(DocumentService, 'uploadToCloudinary', async () => ({
      secure_url: 'https://res.cloudinary.com/demo/image/upload/bon-reception.pdf',
      public_id: 'kouma-academy/commandes/bons-reception-signes/test-123',
      bytes: 1024,
    }));

    const cmdLabe = await app
      .post('/api/v1/commandes')
      .set(adminHeaders)
      .send({
        creeParAdmin: true,
        structure_sanitaire: ['HOPITAL REGIONAL DE LABE'],
        equipements: [{ equipement: equipementId, quantiteCommandee: 2 }],
      });
    const cmdId = cmdLabe.body.data._id;

    // Utilisateur d'une autre structure -> 403
    const forbiddenUpload = await app
      .post(`/api/v1/commandes/${cmdId}/bon-reception-signe`)
      .set(mamouHeaders)
      .attach('file', Buffer.from('%PDF-1.4 test'), {
        filename: 'bon-reception.pdf',
        contentType: 'application/pdf',
      });
    assert.equal(forbiddenUpload.status, 403);

    // Même la structure destinataire ne peut pas téléverser avant réception.
    const uploadBeforeReception = await app
      .post(`/api/v1/commandes/${cmdId}/bon-reception-signe`)
      .set(labeHeaders)
      .attach('file', Buffer.from('%PDF-1.4 test'), {
        filename: 'bon-reception.pdf',
        contentType: 'application/pdf',
      });
    assert.equal(uploadBeforeReception.status, 403);

    await registerReception(cmdId);

    // Membre de Labé -> 200 upload
    const uploadRes = await app
      .post(`/api/v1/commandes/${cmdId}/bon-reception-signe`)
      .set(labeHeaders)
      .attach('file', Buffer.from('%PDF-1.4 test'), {
        filename: 'bon-reception.pdf',
        contentType: 'application/pdf',
      });
    assert.equal(uploadRes.status, 200);
    assert.equal(
      uploadRes.body.data.bonReceptionSigne.url,
      'https://res.cloudinary.com/demo/image/upload/bon-reception.pdf'
    );
    assert.equal(uploadRes.body.data.bonReceptionSigne.nomOriginal, 'bon-reception.pdf');
    assert.equal(uploadRes.body.data.bonReceptionSigne.deletedAt, null);

    // Utilisateur d'une autre structure -> 403 sur DELETE
    const forbiddenDel = await app
      .delete(`/api/v1/commandes/${cmdId}/bon-reception-signe`)
      .set(mamouHeaders);
    assert.equal(forbiddenDel.status, 403);

    // Membre de Labé -> 200 soft delete
    const delRes = await app
      .delete(`/api/v1/commandes/${cmdId}/bon-reception-signe`)
      .set(labeHeaders);
    assert.equal(delRes.status, 200);
    assert.ok(delRes.body.data.bonReceptionSigne.deletedAt);
    assert.equal(delRes.body.data.bonReceptionSigne.deletedBy, labeUserId);
  });
});
