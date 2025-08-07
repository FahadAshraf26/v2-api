import { Result } from 'oxide.ts';
import { User } from '@/domain/entities/user.entity';

export interface IUserRepository {
  create(user: User): Promise<Result<User, Error>>;
  findById(id: string): Promise<Result<User | null, Error>>;
  findByEmail(email: string): Promise<Result<User | null, Error>>;
  update(user: User): Promise<Result<User, Error>>;
  delete(id: string): Promise<Result<void, Error>>;
  findAll(limit?: number, offset?: number): Promise<Result<User[], Error>>;
}
