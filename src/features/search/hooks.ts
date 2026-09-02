import { useQuery } from '@tanstack/react-query';

import * as api from './api';

export function useSearchStories(query: string) {
  return useQuery({
    queryKey: ['search', query.trim()],
    queryFn: () => api.searchStories(query),
    enabled: query.trim().length > 0,
  });
}
