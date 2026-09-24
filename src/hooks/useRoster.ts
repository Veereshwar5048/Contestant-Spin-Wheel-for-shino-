import { useState, useCallback, useEffect } from 'react';
import type { Person, HistoryEntry, RosterKind } from '../types';

// ─── Seed data ────────────────────────────────────────────────────────────────
const CONTESTANT_SEED: Person[] = [
  { id: 'c1', name: 'Sushanth Muralikrishnan', selected: false },
  { id: 'c2', name: 'Sri Sanjana S', selected: false },
  { id: 'c3', name: 'Samuel Sangeeth Ponraj', selected: false },
  { id: 'c4', name: 'Sadhana S', selected: false },
  { id: 'c5', name: 'Ruskin Bruce A', selected: false },
  { id: 'c6', name: 'Mohamed Abid M', selected: false },
  { id: 'c7', name: 'Renee Sharon', selected: false },
];

const JUDGE_SEED: Person[] = [
  { id: 'j1', name: 'Sushanth Muralikrishnan', selected: false },
  { id: 'j2', name: 'Samuel Sangeeth Ponraj', selected: false },
  { id: 'j3', name: 'Ruskin Bruce A', selected: false },
  { id: 'j4', name: 'Renee Sharon', selected: false },
];

// ─── Storage helpers ──────────────────────────────────────────────────────────
function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota exceeded or private mode */
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────
interface UseRosterOptions {
  kind: RosterKind;
}

interface UseRosterReturn {
  people: Person[];
  history: HistoryEntry[];
  pendingRevealId: string | null;
  clearPendingReveal: () => void;

  selectPerson: (id: string) => void;
  undoLastSelection: () => void;
  resetAll: () => void;
  addPerson: (name: string) => string | null; // returns error string or null
  editPerson: (id: string, name: string) => string | null;
  removePerson: (id: string) => void;
}

const STORAGE_KEYS = {
  contestant: {
    roster: 'toastmasters_contestants',
    history: 'toastmasters_contestant_history',
    pending: 'toastmasters_contestant_pending',
  },
  judge: {
    roster: 'toastmasters_judges',
    history: 'toastmasters_judge_history',
    pending: 'toastmasters_judge_pending',
  },
} as const;

export function useRoster({ kind }: UseRosterOptions): UseRosterReturn {
  const keys = STORAGE_KEYS[kind];
  const seedData = kind === 'contestant' ? CONTESTANT_SEED : JUDGE_SEED;

  const [people, setPeople] = useState<Person[]>(() =>
    safeGet<Person[]>(keys.roster, seedData),
  );
  const [history, setHistory] = useState<HistoryEntry[]>(() =>
    safeGet<HistoryEntry[]>(keys.history, []),
  );
  const [pendingRevealId, setPendingRevealId] = useState<string | null>(() =>
    safeGet<string | null>(keys.pending, null),
  );

  // Persist on change
  useEffect(() => { safeSet(keys.roster, people); }, [people, keys.roster]);
  useEffect(() => { safeSet(keys.history, history); }, [history, keys.history]);
  useEffect(() => { safeSet(keys.pending, pendingRevealId); }, [pendingRevealId, keys.pending]);

  const selectPerson = useCallback((id: string) => {
    setPeople(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, selected: true } : p);
      return updated;
    });
    setHistory(prev => {
      const nextOrder = prev.length + 1;
      const person = people.find(p => p.id === id);
      if (!person) return prev;
      const entry: HistoryEntry = {
        personId: id,
        name: person.name,
        order: nextOrder,
        timestamp: Date.now(),
      };
      return [...prev, entry];
    });
    setPendingRevealId(id);
  }, [people]);

  const clearPendingReveal = useCallback(() => {
    setPendingRevealId(null);
  }, []);

  const undoLastSelection = useCallback(() => {
    setHistory(prev => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setPeople(p => p.map(person =>
        person.id === last.personId ? { ...person, selected: false } : person
      ));
      setPendingRevealId(null);
      return prev.slice(0, -1);
    });
  }, []);

  const resetAll = useCallback(() => {
    setPeople(seedData.map(p => ({ ...p, selected: false })));
    setHistory([]);
    setPendingRevealId(null);
  }, [seedData]);

  const addPerson = useCallback((name: string): string | null => {
    const trimmed = name.trim();
    if (!trimmed) return 'Name cannot be empty.';
    const lower = trimmed.toLowerCase();
    if (people.some(p => p.name.toLowerCase() === lower)) {
      return 'A person with this name already exists in this roster.';
    }
    const id = `${kind}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setPeople(prev => [...prev, { id, name: trimmed, selected: false }]);
    return null;
  }, [people, kind]);

  const editPerson = useCallback((id: string, name: string): string | null => {
    const trimmed = name.trim();
    if (!trimmed) return 'Name cannot be empty.';
    const lower = trimmed.toLowerCase();
    if (people.some(p => p.id !== id && p.name.toLowerCase() === lower)) {
      return 'A person with this name already exists in this roster.';
    }
    setPeople(prev => prev.map(p => p.id === id ? { ...p, name: trimmed } : p));
    // Update history entries for this person
    setHistory(prev => prev.map(h => h.personId === id ? { ...h, name: trimmed } : h));
    return null;
  }, [people]);

  const removePerson = useCallback((id: string) => {
    setPeople(prev => prev.filter(p => p.id !== id));
    // Keep history entries; they are a log. Just remove if pending.
    setPendingRevealId(prev => prev === id ? null : prev);
  }, []);

  return {
    people,
    history,
    pendingRevealId,
    clearPendingReveal,
    selectPerson,
    undoLastSelection,
    resetAll,
    addPerson,
    editPerson,
    removePerson,
  };
}
