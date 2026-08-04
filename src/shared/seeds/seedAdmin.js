import { connectDatabase } from '../../infrastructure/database/connection.js';
import { UserModel } from '../../modules/user/infrastructure/persistence/models/User.model.js';
import argon2 from 'argon2';

async function seedAdmin() {
    try {
        await connectDatabase();
        
        // On force l'utilisation des variables d'environnement
        let username = process.env.ADMIN_USERNAME;
        let password = process.env.ADMIN_PASSWORD;
        const nom = process.env.ADMIN_NOM;
        const prenom = process.env.ADMIN_PRENOM;
        const tel = process.env.ADMIN_TEL;

        if (process.env.NODE_ENV === 'production') {
            if (!username || !password || !nom || !prenom || !tel) {
                throw new Error("ERREUR CRITIQUE: variables d'admin manquantes.");
            }
        }
        
        const adminExists = await UserModel.findOne({ type: 'Admin' });
        
        if (!adminExists) {
            const hashedPassword = await argon2.hash(password);
            await UserModel.create({
                username: username,
                password: hashedPassword,
                nom: nom,
                prenom: prenom,
                tel: tel,
                type: 'Admin',
                isActive: true,
            });
            console.log(`[Seed] Compte administrateur cree : ${username}`);
        } else {
            console.log('[Seed] Un administrateur existe deja.');
        }
    } catch (error) {
        console.error('[Seed] Erreur lors de la creation de l\'admin:', error);
    } 
}

export { seedAdmin };