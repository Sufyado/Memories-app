import { useMutation, useQueryClient } from '@tanstack/react-query';

import { loadDemoData } from './seed';
import { useAuth } from '@/features/auth/AuthProvider';

export function useLoadDemoData() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: () => loadDemoData(user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
}
