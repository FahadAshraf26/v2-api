import { PaginatedResult } from '@/domain/core/repository.interface';

export class PaginatedDto<T> implements PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;

  constructor(data: PaginatedResult<T>) {
    this.items = data.items;
    this.total = data.total;
    this.page = data.page;
    this.perPage = data.perPage;
    this.totalPages = data.totalPages;
    this.hasNext = data.hasNext;
    this.hasPrevious = data.hasPrevious;
  }

  toJSON() {
    return {
      items: this.items,
      total: this.total,
      page: this.page,
      perPage: this.perPage,
      totalPages: this.totalPages,
      hasNext: this.hasNext,
      hasPrevious: this.hasPrevious,
    };
  }
}
