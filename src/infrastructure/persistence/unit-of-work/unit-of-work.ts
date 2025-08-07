import { Transaction } from 'sequelize';
import { injectable, inject } from 'tsyringe';
import { Result, Ok, Err } from 'oxide.ts';
import { DatabaseService } from '@/infrastructure/database/database.service';

export interface IUnitOfWork {
  begin(): Promise<Result<void, Error>>;
  commit(): Promise<Result<void, Error>>;
  rollback(): Promise<Result<void, Error>>;
  getTransaction(): Transaction | null;
}

@injectable()
export class UnitOfWork implements IUnitOfWork {
  private transaction: Transaction | null = null;

  constructor(@inject(DatabaseService) private readonly db: DatabaseService) {}

  async begin(): Promise<Result<void, Error>> {
    try {
      this.transaction = await this.db.getSequelize().transaction();
      return Ok(undefined);
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async commit(): Promise<Result<void, Error>> {
    try {
      if (!this.transaction) {
        return Err(new Error('No transaction to commit'));
      }
      await this.transaction.commit();
      this.transaction = null;
      return Ok(undefined);
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async rollback(): Promise<Result<void, Error>> {
    try {
      if (!this.transaction) {
        return Err(new Error('No transaction to rollback'));
      }
      await this.transaction.rollback();
      this.transaction = null;
      return Ok(undefined);
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  getTransaction(): Transaction | null {
    return this.transaction;
  }
}
