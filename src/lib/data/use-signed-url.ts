import { useEffect, useState } from 'react';

import { getSignedUrl } from '@/lib/data/media';

/** Resolves a private-bucket storage path to a signed URL for display. */
export function useSignedUrl(storagePath: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Clear the previous path's URL immediately so a stale image never
    // flashes while the new signed URL is fetched.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrl(null);
    if (!storagePath) return;

    getSignedUrl(storagePath)
      .then((signed) => {
        if (!cancelled) setUrl(signed);
      })
      .catch(() => {
        if (!cancelled) setUrl(null);
      });

    return () => {
      cancelled = true;
    };
  }, [storagePath]);

  return url;
}
