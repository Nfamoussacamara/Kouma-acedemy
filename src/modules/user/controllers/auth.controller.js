import { asyncHandler } from '../../../shared/errors/asyncHandler.js';
import { AuthService } from '../services/auth.service.js';
import { UserService } from '../services/user.service.js';

export class AuthController {
  static login = asyncHandler(async (req, res) => {
    const result = await AuthService.login(req.body);
    return res.json({
      success: true,
      data: result,
      message: 'Connexion réussie',
    });
  });
  

  static register =asyncHandler( async (req, res) => {
    const user = await UserService.createUser(req.body);
    res.status(201).json({
      success: true,
      data: user,
      message: 'Utilisateur créé avec succès',
    });
  });

  static refresh = asyncHandler(async (req, res) => {
    const result = await AuthService.refresh(req.body);
    res.json({
      success: true,
      data: result,
      message: 'Jeton de session rafraîchi avec succès',
    });
  });
}
