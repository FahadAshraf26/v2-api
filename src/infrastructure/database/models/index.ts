import { Sequelize } from 'sequelize';
import {
  UserModel,
  initUserModel,
} from '@/infrastructure/database/models/user.model';

export const initializeModels = (sequelize: Sequelize): void => {
  // Initialize models
  initUserModel(sequelize);

  // Define associations here
  // Example: UserModel.hasMany(PostModel, { foreignKey: 'userId' });
};

export { UserModel };
