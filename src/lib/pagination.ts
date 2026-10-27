export const DEFAULT_PAGE_SIZE = 10;

export function parsePage(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export function getPagination(totalRows: number, page: number, pageSize = DEFAULT_PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;

  return {
    page: currentPage,
    pageSize,
    totalPages,
    from,
    to,
    hasPrevious: currentPage > 1,
    hasNext: currentPage < totalPages,
  };
}

export function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
