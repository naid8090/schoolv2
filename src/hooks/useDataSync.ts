/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';

/**
 * A custom hook to listen for the 'gsss-data-synced' event.
 * Automatically handles registering and cleaning up the event listener.
 * Employs a ref pattern to avoid unnecessary re-registrations or dependency array thrashing.
 *
 * @param onSync Callback function invoked when a data synchronization event occurs.
 */
export function useDataSync(onSync: () => void): void {
  const syncRef = useRef(onSync);

  // Maintain references to the latest callback function
  useEffect(() => {
    syncRef.current = onSync;
  }, [onSync]);

  useEffect(() => {
    const handleSync = () => {
      if (syncRef.current) {
        syncRef.current();
      }
    };

    window.addEventListener('gsss-data-synced', handleSync);

    return () => {
      window.removeEventListener('gsss-data-synced', handleSync);
    };
  }, []);
}
