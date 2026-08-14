import { authPaths } from '../paths/auth.docs.js';
import { userPaths } from '../paths/user.docs.js';
import { fournisseurPaths } from '../paths/fournisseur.docs.js';
import { equipementPaths } from '../paths/equipement.docs.js';
import { typeEquipementPaths } from '../paths/typeEquipement.docs.js';
import { commandePaths } from '../paths/commande.docs.js';
import { dashboardPaths } from '../paths/dashboard.docs.js';

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Kouma Academy API',
    version: '1.0.0',
    description: 'Documentation officielle de l\'API Kouma Academy pour les modules Auth, Users, Fournisseurs, Equipements, Types d\'équipements, Commandes et Dashboard.',
  },
  servers: [
    { url: '/api/v1', description: 'Serveur local de développement' }
  ],
  paths: {
    ...authPaths,
    ...userPaths,
    ...fournisseurPaths,
    ...equipementPaths,
    ...typeEquipementPaths,
    ...commandePaths,
    ...dashboardPaths,
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
