import { createContext, useContext } from 'react';
import type { AppConfig, PlaygroundConfig } from '../api/types';

export const AppContext = createContext<{
  config: AppConfig | null;
  pgConfig: PlaygroundConfig | null;
  refresh: () => Promise<void>;
}>({ config: null, pgConfig: null, refresh: async () => {} });

export function useApp() {
  return useContext(AppContext);
}
