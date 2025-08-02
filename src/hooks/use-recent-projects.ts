
import { useState, useEffect, useCallback } from 'react';

interface RecentProject {
  name: string;
  handle: FileSystemDirectoryHandle;
}

const MAX_RECENT_PROJECTS = 10;
const STORAGE_KEY = 'recentProjects';

// Note: Storing handles directly in localStorage is not possible.
// We use a trick with IndexedDB to persist handles across sessions.

const idb = {
  db: null as IDBDatabase | null,
  async getDb() {
    if (this.db) return this.db;
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('file-system-handles', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      request.onupgradeneeded = () => {
        request.result.createObjectStore('handles');
      };
    });
  },
  async get(key: IDBValidKey) {
    const db = await this.getDb();
    return new Promise<any>((resolve, reject) => {
      const tx = db.transaction('handles', 'readonly');
      const request = tx.objectStore('handles').get(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  },
  async set(key: IDBValidKey, value: any) {
    const db = await this.getDb();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction('handles', 'readwrite');
      tx.objectStore('handles').put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
};

export default function useRecentProjects() {
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRecentProjects = async () => {
      setIsLoading(true);
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const projectNames: string[] = stored ? JSON.parse(stored) : [];
        
        const projects: RecentProject[] = [];
        for (const name of projectNames) {
          try {
            const handle = await idb.get(name);
            if (handle) {
              // Verify we still have permission
              const permission = await handle.queryPermission({ mode: 'readwrite' });
              if (permission === 'granted') {
                projects.push({ name, handle });
              }
            }
          } catch(e) {
            console.warn(`Could not load recent project handle for "${name}":`, e);
          }
        }
        setRecentProjects(projects);
      } catch (error) {
        console.error("Failed to load recent projects:", error);
        // Clear corrupted storage
        localStorage.removeItem(STORAGE_KEY);
      }
      setIsLoading(false);
    };

    loadRecentProjects();
  }, []);

  const addRecentProject = useCallback((newProjectHandle: FileSystemDirectoryHandle) => {
    const newProject: RecentProject = {
      name: newProjectHandle.name,
      handle: newProjectHandle,
    };
    
    setRecentProjects(prev => {
      const withoutOld = prev.filter(p => p.name !== newProject.name);
      const newProjects = [newProject, ...withoutOld].slice(0, MAX_RECENT_PROJECTS);
      
      const projectNames = newProjects.map(p => p.name);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projectNames));
      
      idb.set(newProject.name, newProject.handle).catch(error => {
          console.error("Failed to save project handle to IndexedDB", error);
      });

      return newProjects;
    });
  }, []);

  return { recentProjects, addRecentProject, isLoading };
}
