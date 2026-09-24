// ─── Types ───────────────────────────────────────────────────────────────────
export interface Person {
  id: string;
  name: string;
  selected: boolean;
}

export interface HistoryEntry {
  id: string;
  personId: string;
  name: string;
  order: number;
  timestamp: string;
}

export interface Settings {
  contestName: string;
  clubName: string;
  date: string;
  venue: string;
  soundOn: boolean;
}

export type RosterKind = 'contestant' | 'judge';
