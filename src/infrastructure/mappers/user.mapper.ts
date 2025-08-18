import { injectable } from 'tsyringe';

import { User } from '@/domain/user/entity/user.entity';

import { UserModelAttributes, UserProps } from '@/types/user';

@injectable()
export class UserMapper {
  toDomain(model: any): User {
    const props: UserProps = model.dataValues ? model.dataValues : model;
    return User.fromPersistence(props);
  }

  toPersistence(domain: User): UserModelAttributes {
    return domain.toObject();
  }
}
