export const TOKENS = {
  CacheServiceToken: Symbol.for('CacheService'),
  DatabaseServiceToken: Symbol.for('DatabaseService'),

  UserRepositoryToken: Symbol.for('UserRepository'),
  UserServiceToken: Symbol.for('UserService'),
} as const;

export const setupDependencyInjection = async (): Promise<void> => {
  const { container } = await import('tsyringe');
  const { CacheService } = await import('@/infrastructure/cache/cache.service');
  const { DatabaseService } = await import(
    '@/infrastructure/database/database.service'
  );

  container.registerSingleton(TOKENS.CacheServiceToken, CacheService);
  container.registerSingleton(TOKENS.DatabaseServiceToken, DatabaseService);
};
