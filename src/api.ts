import { CONFIG } from './config';

export interface Option {
  id: number;
  text: string;
  emoji: string;
  votes: number;
}

export interface VotingData {
  question: string;
  options: Option[];
  total_votes: number;
}

export async function fetchData(): Promise<VotingData> {
  const res = await fetch(CONFIG.API_URL + '/latest', {
    headers: { 'X-Master-Key': CONFIG.API_KEY }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  const json = await res.json();
  return json.record;
}

export async function updateData(data: VotingData): Promise<VotingData> {
  const res = await fetch(CONFIG.API_URL, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': CONFIG.API_KEY,
      'X-Bin-Versioning': 'false'
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  const json = await res.json();
  return json.record;
}
