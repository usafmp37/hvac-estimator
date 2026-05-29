import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import { DEFAULT_PRICING_CONFIG } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export type SyncStatus = 'loading' | 'ready' | 'saving' | 'error';

interface DataSyncContextValue {
  syncStatus: SyncStatus;
  lastSaved: Date | null;
}

const DataSyncContext = createContext<DataSyncContextValue>({
  syncStatus: 'loading',
  lastSaved: null,
});

export function useDataSync() {
  return useContext(DataSyncContext);
}

function getDataSnapshot() {
  const s = useStore.getState();
  return {
    builders: s.builders,
    projects: s.projects,
    proposal_items: s.proposalItems,
    pricing_config: s.pricingConfig,
  };
}

const COMPANY_ID = 'company';

export function DataSyncProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('loading');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readyToSave = useRef(false);

  const save = useCallback(async () => {
    if (!user) return;
    try {
      setSyncStatus('saving');
      const { error } = await supabase
        .from('shared_data')
        .upsert({ id: COMPANY_ID, ...getDataSnapshot(), updated_at: new Date().toISOString() });
      if (error) throw error;
      setLastSaved(new Date());
      setSyncStatus('ready');
    } catch (e) {
      console.error('[DataSync] save error:', e);
      setSyncStatus('error');
    }
  }, [user]);

  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(save, 800);
  }, [save]);

  // When user logs in: fetch shared data and hydrate the store
  useEffect(() => {
    if (!user) {
      readyToSave.current = false;
      setSyncStatus('loading');
      return;
    }

    (async () => {
      setSyncStatus('loading');
      const { data, error } = await supabase
        .from('shared_data')
        .select('*')
        .eq('id', COMPANY_ID)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('[DataSync] load error:', error);
        setSyncStatus('error');
        return;
      }

      if (data) {
        // Load shared company data into the store
        useStore.setState({
          builders:      data.builders      ?? useStore.getState().builders,
          projects:      data.projects      ?? [],
          proposalItems: data.proposal_items ?? useStore.getState().proposalItems,
          pricingConfig: { ...DEFAULT_PRICING_CONFIG, ...(data.pricing_config ?? {}) },
        });
      } else {
        // First time — seed the shared record with current store defaults
        const { error: insertError } = await supabase
          .from('shared_data')
          .insert({ id: COMPANY_ID, ...getDataSnapshot(), updated_at: new Date().toISOString() });
        if (insertError) {
          console.error('[DataSync] insert error:', insertError);
          setSyncStatus('error');
          return;
        }
      }

      readyToSave.current = true;
      setSyncStatus('ready');
    })();
  }, [user]);

  // Auto-save on every store change
  useEffect(() => {
    const unsub = useStore.subscribe(() => {
      if (!readyToSave.current) return;
      scheduleSave();
    });
    return () => {
      unsub();
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [scheduleSave]);

  return (
    <DataSyncContext.Provider value={{ syncStatus, lastSaved }}>
      {children}
    </DataSyncContext.Provider>
  );
}
