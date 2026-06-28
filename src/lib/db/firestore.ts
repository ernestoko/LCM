"use client";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  runTransaction,
  query,
  serverTimestamp,
  type QueryConstraint,
  type DocumentData,
  type Unsubscribe,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { cleanForWrite } from "@/lib/utils/clean";
import { COLLECTIONS, type CollectionName } from "./collections";

/**
 * Thin, strongly-typed wrapper over the Firestore client SDK.
 *
 * Dates are stored as ISO strings (the `ISODate` type), which sort
 * chronologically and avoid Timestamp ↔ Date conversion bugs across the
 * client/server boundary. `createdAt`/`updatedAt` are stamped automatically.
 */

export type WithId<T> = T & { id: string };

function db() {
  return getDb();
}

/** Attach the document id to its data. */
function withId<T extends DocumentData>(snap: { id: string; data: () => T | undefined }): WithId<T> {
  return { id: snap.id, ...(snap.data() as T) };
}

/** Strip undefined values (Firestore rejects them, even nested) and the id field. */
const clean = cleanForWrite;

export async function getOne<T extends DocumentData>(
  name: CollectionName,
  id: string,
): Promise<WithId<T> | null> {
  const snap = await getDoc(doc(db(), name, id));
  return snap.exists() ? withId<T>(snap as never) : null;
}

export async function getMany<T extends DocumentData>(
  name: CollectionName,
  ...constraints: QueryConstraint[]
): Promise<WithId<T>[]> {
  const q = query(collection(db(), name), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => withId<T>(d as never));
}

/** Live subscription. Returns an unsubscribe function. */
export function subscribe<T extends DocumentData>(
  name: CollectionName,
  onData: (rows: WithId<T>[]) => void,
  onError?: (e: Error) => void,
  ...constraints: QueryConstraint[]
): Unsubscribe {
  const q = query(collection(db(), name), ...constraints);
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => withId<T>(d as never))),
    (err) => onError?.(err),
  );
}

export function subscribeOne<T extends DocumentData>(
  name: CollectionName,
  id: string,
  onData: (row: WithId<T> | null) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db(), name, id),
    (snap) => onData(snap.exists() ? withId<T>(snap as never) : null),
    (err) => onError?.(err),
  );
}

const nowISO = () => new Date().toISOString();

export async function create<T extends object>(
  name: CollectionName,
  data: T,
  actor?: { uid: string; name?: string },
): Promise<string> {
  const payload = clean({
    ...data,
    createdAt: (data as { createdAt?: string }).createdAt ?? nowISO(),
    createdBy: actor?.uid ?? (data as { createdBy?: string }).createdBy ?? "system",
    createdByName: actor?.name ?? (data as { createdByName?: string }).createdByName,
    _serverCreatedAt: serverTimestamp(),
  });
  const ref = await addDoc(collection(db(), name), payload);
  return ref.id;
}

/** Create or overwrite a document at a known id (used for singletons). */
export async function upsert<T extends object>(
  name: CollectionName,
  id: string,
  data: T,
  merge = true,
): Promise<void> {
  await setDoc(doc(db(), name, id), clean({ ...data, updatedAt: nowISO() }), { merge });
}

export async function update<T extends object>(
  name: CollectionName,
  id: string,
  data: Partial<T>,
  actor?: { uid: string; name?: string },
): Promise<void> {
  await updateDoc(
    doc(db(), name, id),
    clean({ ...data, updatedAt: nowISO(), updatedBy: actor?.uid }) as DocumentData,
  );
}

export async function remove(name: CollectionName, id: string): Promise<void> {
  await deleteDoc(doc(db(), name, id));
}

/**
 * Atomically increment and return the next value of a named counter, used for
 * gap-free invoice / manifest / payment / ticket numbers.
 */
export async function nextSequence(counterName: string): Promise<number> {
  const ref = doc(db(), COLLECTIONS.counters, counterName);
  return runTransaction(db(), async (tx) => {
    const snap = await tx.get(ref);
    const current = (snap.data()?.value as number | undefined) ?? 0;
    const next = current + 1;
    tx.set(ref, { value: next, updatedAt: nowISO() }, { merge: true });
    return next;
  });
}
