import { useState, useMemo, useCallback } from "react";

export interface UsePaginationOptions {
  totalItems: number;
  initialPage?: number;
  pageSize?: number;
  onChange?: (page: number) => void;
}

export interface UsePaginationResult {
  page: number;
  pageSize: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  pageItems: number[];
  setPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  reset: () => void;
}

export function usePagination({
  totalItems,
  initialPage = 1,
  pageSize = 10,
  onChange,
}: UsePaginationOptions): UsePaginationResult {
  const [page, setPage] = useState(initialPage);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalItems / pageSize)),
    [totalItems, pageSize]
  );

  const safePage = useMemo(
    () => Math.min(page, totalPages),
    [page, totalPages]
  );

  const startIndex = useMemo(
    () => (safePage - 1) * pageSize,
    [safePage, pageSize]
  );

  const endIndex = useMemo(
    () => Math.min(startIndex + pageSize, totalItems),
    [startIndex, pageSize, totalItems]
  );

  const pageItems = useMemo(
    () =>
      Array.from({ length: endIndex - startIndex }, (_, i) => startIndex + i),
    [startIndex, endIndex]
  );

  const updatePage = useCallback(
    (next: number) => {
      const clamped = Math.max(1, Math.min(next, totalPages));
      setPage(clamped);
      onChange?.(clamped);
    },
    [totalPages, onChange]
  );

  const setPageSafe = useCallback(
    (next: number) => updatePage(next),
    [updatePage]
  );

  const nextPage = useCallback(() => updatePage(safePage + 1), [safePage, updatePage]);
  const prevPage = useCallback(() => updatePage(safePage - 1), [safePage, updatePage]);
  const reset = useCallback(() => updatePage(initialPage), [initialPage, updatePage]);

  return {
    page: safePage,
    pageSize,
    totalPages,
    startIndex,
    endIndex,
    pageItems,
    setPage: setPageSafe,
    nextPage,
    prevPage,
    reset,
  };
}
