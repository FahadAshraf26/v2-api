export const TOKENS = {
  LoggerServiceToken: Symbol.for('LoggerService'),
  CacheServiceToken: Symbol.for('CacheService'),
  DatabaseServiceToken: Symbol.for('DatabaseService'),
  ORMAdapterToken: Symbol.for('ORMAdapter'),
} as const;

export const setupDependencyInjection = async (): Promise<void> => {
  const { container } = await import('tsyringe');
  const { LoggerService } = await import(
    '@/infrastructure/logging/logger.service'
  );
  const { CacheService } = await import('@/infrastructure/cache/cache.service');
  const { DatabaseService } = await import(
    '@/infrastructure/database/database.service'
  );

  container.registerSingleton(TOKENS.LoggerServiceToken, LoggerService);
  container.registerSingleton(TOKENS.CacheServiceToken, CacheService);
  container.registerSingleton(TOKENS.DatabaseServiceToken, DatabaseService);
};
