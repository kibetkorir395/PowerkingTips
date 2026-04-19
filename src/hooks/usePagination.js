import { useState, useCallback, useRef } from 'react';

export function usePagination(initialPageSize = 20) {
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const pageSize = initialPageSize;
  const observerRef = useRef(null);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1);
    }
  }, [loading, hasMore]);

  const lastElementRef = useCallback(
    (node) => {
      if (loading) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      });
      if (node) observerRef.current.observe(node);
    },
    [loading, hasMore, loadMore]
  );

  const reset = useCallback(() => {
    setPage(1);
    setHasMore(true);
    setLoading(false);
  }, []);

  return {
    page,
    pageSize,
    hasMore,
    setHasMore,
    loading,
    setLoading,
    loadMore,
    lastElementRef,
    reset,
  };
}
