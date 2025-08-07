export abstract class Entity<T> {
  protected readonly _id: string | undefined;

  constructor(id?: string) {
    this._id = id;
  }

  get id(): string | undefined {
    return this._id;
  }

  equals(entity: Entity<T>): boolean {
    if (entity === null || entity === undefined) {
      return false;
    }
    if (this === entity) {
      return true;
    }
    if (!this._id || !entity._id) {
      return false;
    }
    return this._id === entity._id;
  }

  abstract toObject(): T;
}
