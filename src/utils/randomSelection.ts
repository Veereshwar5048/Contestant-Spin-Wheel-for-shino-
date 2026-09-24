import { cryptoRandInt } from './wheelMath';
import type { Person } from '../types';

/**
 * Pick a random person from the unselected list using rejection sampling.
 * Returns the index into the unselected array.
 */
export function pickRandom(unselected: Person[]): number {
  if (unselected.length === 0) throw new Error('No unselected people');
  return cryptoRandInt(unselected.length);
}
