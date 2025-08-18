export interface PaginationParams {
  page?: number;
  perPage?: number;
}

export function getPaginationOptions({
  page = 1,
  perPage = 10,
}: PaginationParams) {
  const take = perPage;
  const skip = (page - 1) * take;
  return { take, skip };
}

export function formatPaginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  perPage: number
) {
  return {
    items,
    pagination: {
      total,
      per_page: perPage,
      current_page: page,
      last_page: Math.ceil(total / perPage),
    },
  };
}

export function formatNoDataResponse(message = "No records found.") {
  return {
    success: false,
    items: [],
    pagination: {
      total: 0,
      per_page: 1,
      current_page: 1,
      last_page: 1,
    },
    message,
  };
}
