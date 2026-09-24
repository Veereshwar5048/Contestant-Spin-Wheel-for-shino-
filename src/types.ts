// ─── Types ───────────────────────────────────────────────────────────────────
export interface Person {
  id: string;
  name: string;
  selected: boolean;
}

export interface HistoryEntry {
  personId: string;
  name: string;
  order: number;
  timestamp: number;
}

export interface Settings {
  contestName: string;
  clubName: string;
  date: string;
  venue: string;
  soundOn: boolean;
}

export type RosterKind = 'contestant' | 'judge';
