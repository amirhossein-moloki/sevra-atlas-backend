export interface PaginationParams {
  page: number;
  limit: number;
}

export const getPagination = (query: Record<string, unknown>): PaginationParams => {
  const page = Math.max(1, parseInt(query.page as string) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(query.limit as string) || 10));
  return { page, limit };
};

export const formatPaginatedResponse = <T>(data: T[], total: number, params: PaginationParams) => {
  return {
    data,
    meta: {
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    },
  };
};
