export const TOKENS = {
  CacheServiceToken: Symbol.for('CacheService'),
  DatabaseServiceToken: Symbol.for('DatabaseService'),

  UserRepositoryToken: Symbol.for('UserRepository'),
  UserServiceToken: Symbol.for('UserService'),

  CreateUserUseCaseToken: Symbol.for('CreateUserUseCase'),
  GetUserUseCaseToken: Symbol.for('GetUserUseCase'),

  UserControllerToken: Symbol.for('UserController'),
} as const;

export const setupDependencyInjection = async (): Promise<void> => {
  const { container } = await import('tsyringe');
  const { CacheService } = await import('@/infrastructure/cache/cache.service');
  const { DatabaseService } = await import(
    '@/infrastructure/database/database.service'
  );
  const { UserRepository } = await import(
    '@/infrastructure/repositories/user.respository'
  );
  const { UserService } = await import('@/application/services/user.service');
  const { CreateUserUseCase } = await import(
    '@/application/use-cases/user/create-user.use-case'
  );
  const { GetUserUseCase } = await import(
    '@/application/use-cases/user/get-user.use-case'
  );
  const { UserController } = await import(
    '@/presentation/controllers/user.controller'
  );

  container.registerSingleton(TOKENS.CacheServiceToken, CacheService);
  container.registerSingleton(TOKENS.DatabaseServiceToken, DatabaseService);

  container.registerSingleton(TOKENS.UserRepositoryToken, UserRepository);

  container.registerSingleton(TOKENS.UserServiceToken, UserService);

  container.registerSingleton(TOKENS.CreateUserUseCaseToken, CreateUserUseCase);
  container.registerSingleton(TOKENS.GetUserUseCaseToken, GetUserUseCase);

  container.registerSingleton(TOKENS.UserControllerToken, UserController);
};
