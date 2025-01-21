export type Entry = {
  entryId?: number;
  title: string;
  notes: string;
  photoUrl: string;
};

// type Data = {
//   entries: Entry[];
//   nextEntryId: number;
// };

// const dataKey = 'code-journal-data';

async function readData(): Promise<Entry[]> {
  const req = {
    method: 'GET',
  };
  const res = await fetch('/api/entries', req);
  if (!res.ok) throw new Error(`fetch Error ${res.status}`);
  return (await res.json()) as Entry[];
}

// function writeData(data: Data): void {
//   const dataJSON = JSON.stringify(data);
//   localStorage.setItem(dataKey, dataJSON);
// }

export async function readEntries(): Promise<Entry[]> {
  return readData();
}

export async function readEntry(entryId: number): Promise<Entry | undefined> {
  const req = {
    method: 'GET',
  };
  const res = await fetch(`/api/entries/${entryId}`, req);
  if (!res.ok) throw new Error(`fetch error ${res.status}`);
  return (await res.json()) as Entry;
}

export async function addEntry(entry: Entry): Promise<Entry> {
  const req = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  };
  const res = await fetch('/api/new-entry', req);
  if (!res.ok) throw new Error(`fetch error ${res.status}`);
  return (await res.json()) as Entry;
}

export async function updateEntry(entry: Entry): Promise<Entry> {
  const req = {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  };
  const res = await fetch(`/api/entries/${entry.entryId}`, req);
  if (!res.ok) throw new Error(`fetch error ${res.status}`);
  return (await res.json()) as Entry;
}

export async function removeEntry(entryId: number): Promise<void> {
  const req = {
    method: 'DELETE',
  };
  const res = await fetch(`/api/entries/${entryId}`, req);
  if (!res.ok) throw new Error(`fetch error ${res.status}`);
}
