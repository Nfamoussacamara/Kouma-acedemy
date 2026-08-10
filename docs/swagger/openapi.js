import { authPaths } from '../paths/auth.docs.js';
import { userPaths } from '../paths/user.docs.js';
import { fournisseurPaths } from '../paths/fournisseur.docs.js';
import { equipementPaths } from '../paths/equipement.docs.js';
import { typeEquipementPaths } from '../paths/typeEquipement.docs.js';

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Kouma Academy API',
    version: '1.0.0',
    description: 'Documentation officielle de l\'API Kouma Academy pour les modules Auth, Users, Fournisseurs et Equipements.',
  },
  servers: [
    { url: '/api/v1', description: 'Serveur local de développement' }
  ],
  paths: {
    // Fusion de toutes modélisations de routes
    ...authPaths,
    ...userPaths,
    ...fournisseurPaths,
    ...equipementPaths,
    ...typeEquipementPaths
  },
  components: {
    securitySchemes: {
      bearerAuth: { 
        type: 'http', 
        scheme: 'bearer', 
        bearerFormat: 'JWT' 
      },
    }
  }
};
