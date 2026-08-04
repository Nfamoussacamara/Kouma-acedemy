import { UserService } from '../services/user.service.js';
import { asyncHandler } from '../../../shared/errors/asyncHandler.js';

export class UserController {
  static list = asyncHandler(async (req, res) => {
    const result = await UserService.listUsers(req.query);
    res.json({ success: true, ...result });
  });
  

  static getById = asyncHandler(async (req, res) => {
    const user = await UserService.getUserById(req.params.id);
    res.json({ success: true, data: user });
  });

  static getMe = asyncHandler(async (req, res) => {
    const user = await UserService.getUserById(req.user.id);
    res.json({ success: true, data: user });
  });

  static updateMePassword = asyncHandler(async (req, res) => {
    const user = await UserService.changePassword(req.user.id, req.body);
    res.json({ success: true, data: user, message: 'Mot de passe mis à jour avec succès' });
  });

  static create = asyncHandler(async (req, res) => {
    const user = await UserService.createUser(req.body);
    res.status(201).json({ success: true, data: user });
  });

  static update = asyncHandler(async (req, res) => {
    const targetId = req.params.id;
    const isAdmin = req.user.type === 'Admin';

    const updatePayload = { ...req.body };
    if (!isAdmin) {
      delete updatePayload.type;
      delete updatePayload.isActive;
    }

    const user = await UserService.updateUser(targetId, updatePayload);
    res.json({ success: true, data: user });
  });

  static toggleStatus = asyncHandler(async (req, res) => {
    const user = await UserService.toggleUserStatus(req.params.id, req.body);
    res.json({ success: true, data: user, message: 'Statut du compte mis à jour' });
  });

  static delete = asyncHandler(async (req, res) => {
    await UserService.deleteUser(req.params.id);
    res.status(204).send();
  });
}
