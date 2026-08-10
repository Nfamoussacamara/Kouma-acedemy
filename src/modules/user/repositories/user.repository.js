import { UserModel } from "../infrastructure/persistence/models/User.model.js";

export class UserRepository {
  static findAll = async ({ skip, limit, filter }) => {
    return Promise.all([
      UserModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      UserModel.countDocuments(filter),
    ]);
  };

  static findById = async (id) => {
    const document = await UserModel.findOne({ _id: id, deletedAt: null });
    return document ? document : null;
  };

  static findByIdWithPassword = async (id) => {
    const document = await UserModel.findOne({ _id: id, deletedAt: null }).select("+password");
    return document ? document : null;
  };

  static findByUsername = async (username) => {
    const document = await UserModel.findOne({
      username: username.toLowerCase().trim(),
    });
    return document ? document : null;
  };

  static findByUsernameWithPassword = async (username) => {
    const document = await UserModel.findOne({
      username: username.toLowerCase().trim(),
    }).select("+password");
    return document ? document : null;
  };

  static create = async (dto) => {
    const document = await UserModel.create({
      username: dto.username.toLowerCase().trim(),
      password: dto.password,
      nom: dto.nom,
      prenom: dto.prenom,
      tel: dto.tel,
      type: dto.type ?? "Utilisateur",
      isActive: true,
    });
    return document;
  };

  static update = async (id, payload) => {
    const document = await UserModel.findOneAndUpdate({ _id: id, deletedAt: null }, payload, {
      new: true,
      runValidators: true,
    });

    return document ? document : null;
  };

  static deleteLogically = async (id) => {
    const result = await UserModel.updateOne(
      { _id: id, isActive: true },
      { isActive: false, deletedAt: new Date() },
    );

    return result.modifiedCount > 0;
  };
}
