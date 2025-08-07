import { Result, Ok } from 'oxide.ts';

export interface IUseCase<TRequest, TResponse> {
  execute(request: TRequest): Promise<Result<TResponse, Error>>;
}

export abstract class UseCase<TRequest, TResponse>
  implements IUseCase<TRequest, TResponse>
{
  abstract execute(request: TRequest): Promise<Result<TResponse, Error>>;

  protected async validate(request: TRequest): Promise<Result<void, Error>> {
    // Override in concrete implementations
    return Ok(undefined);
  }
}
