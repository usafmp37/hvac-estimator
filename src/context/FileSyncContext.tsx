import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import { DEFAULT_PRICING_CONFIG } from '../types';
import {
  clearStoredHandle, getStoredHandle, isFileSyncSupported,
  pickSaveFile, readDataFromFile, verifyPermission, writeDataToFile,
} from '../utils/fileSync';

export type FileSyncStatus = 'unsupported' | 'loading' | 'no-file' | 'ready' | 'saving' | 'error';

interface FileSyncContextValue {
  status: FileSyncStatus;
  lastSaved: Date | null;
  fileName: string | null;
  setupFile: () => Promise<void>;
  changeFile: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const FileSyncContext = createContext<FileSyncContextValue>({
  status: 'loading',
  lastSaved: null,
  fileName: null,
  setupFile: async () => {},
  changeFile: async () => {},
  disconnect: async () => {},
});

export function useFileSync() {
  return useContext(FileSyncContext);
}

function getDataSnapshot() {
  const s = useStore.getState();
  return {
    builders: s.builders,
    projects: s.projects,
    proposalItems: s.proposalItems,
    pricingConfig: s.pricingConfig,
  };
}

export function FileSyncProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<FileSyncStatus>(
    isFileSyncSupported ? 'loading' : 'unsupported'
  );
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleRef = useRef<FileSystemFileHandle | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Don't auto-save until initial file load is complete (prevents overwriting file on startup)
  const readyToSave = useRef(false);

  // Write current store state to the file
  const save = useCallback(async (handle: FileSystemFileHandle) => {
    try {
      setStatus('saving');
      await writeDataToFile(handle, getDataSnapshot());
      setLastSaved(new Date());
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  // Debounced save — waits 600ms after last change before writing
  const scheduleSave = useCallback(
    (handle: FileSystemFileHandle) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => save(handle), 600);
    },
    [save]
  );

  // On mount: find stored file handle, verify permission, load data
  useEffect(() => {
    if (!isFileSyncSupported) return;
    (async () => {
      const handle = await getStoredHandle();
      if (!handle) {
        setStatus('no-file');
        return;
      }
      const ok = await verifyPermission(handle);
      if (!ok) {
        setStatus('no-file');
        return;
      }
      handleRef.current = handle;
      setFileName(handle.name);

      // Load file data into store
      try {
        const data = await readDataFromFile(handle);
        if (data) {
          const current = useStore.getState();
          useStore.setState({
            builders: (data.builders as typeof current.builders) ?? current.builders,
            projects: (data.projects as typeof current.projects) ?? current.projects,
            proposalItems: (data.proposalItems as typeof current.proposalItems) ?? current.proposalItems,
            pricingConfig: {
              ...DEFAULT_PRICING_CONFIG,
              ...((data.pricingConfig as Partial<typeof current.pricingConfig>) ?? {}),
            },
          });
        }
      } catch {
        // File empty or unreadable — proceed with current localStorage state
      }

      readyToSave.current = true;
      setStatus('ready');
    })();
  }, []);

  // Subscribe to store changes — auto-save after every change
  useEffect(() => {
    const unsub = useStore.subscribe(() => {
      if (!handleRef.current || !readyToSave.current) return;
      scheduleSave(handleRef.current);
    });
    return () => {
      unsub();
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [scheduleSave]);

  // User picks a file location for the first time (or changes it)
  const setupFile = useCallback(async () => {
    const handle = await pickSaveFile();
    if (!handle) return;
    handleRef.current = handle;
    setFileName(handle.name);
    readyToSave.current = true;
    await save(handle);
  }, [save]);

  const changeFile = setupFile;

  const disconnect = useCallback(async () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    await clearStoredHandle();
    handleRef.current = null;
    readyToSave.current = false;
    setFileName(null);
    setLastSaved(null);
    setStatus('no-file');
  }, []);

  return (
    <FileSyncContext.Provider value={{ status, lastSaved, fileName, setupFile, changeFile, disconnect }}>
      {children}
    </FileSyncContext.Provider>
  );
}
