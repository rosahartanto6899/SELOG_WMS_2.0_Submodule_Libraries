interface Request {
  query: {
    [key: string]: string | undefined;
  };
}

export class Pagination {
  static getPagination(page?: number, size?: number) {
    page = page ?? 1;
    const limit: number = size ?? 10;
    const offset: number = page ? (page - 1) * limit : 0;
    return { limit, offset, page };
  }

  static getOffset(request: Request) {
    const page = parseInt(request.query.page ?? '1', 10);
    const perPage = parseInt(request.query.limit ?? '10', 10);
    return page === 1 ? 0 : (page - 1) * perPage;
  }

  static getLimit(request: Request) {
    return parseInt(request.query.limit ?? '10', 10);
  }
}
