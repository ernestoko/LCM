"use client";

import { useEffect, useState } from "react";
import type { QueryConstraint, DocumentData } from "firebase/firestore";
import { subscribe, subscribeOne, type WithId } from "./firestore";
import type { CollectionName } from "./collections";

interface CollectionState<T> {
  data: WithId<T>[];
  loading: boolean;
  error: Error | null;
}

/**
 * Live collection subscription hook. Pass query constraints (where/orderBy/
 * limit) as the rest args. Constraints are serialised for the dependency
 * array so the listener only re-subscribes when they actually change.
 */
export function useCollection<T extends DocumentData>(
  name: CollectionName,
  constraints: QueryConstraint[] = [],
  options: { enabled?: boolean } = {},
): CollectionState<T> {
  const enabled = options.enabled ?? true;
  const [state, setState] = useState<CollectionState<T>>({
    data: [],
    loading: enabled,
    error: null,
  });

  // Stable key from constraint internals.
  const key = JSON.stringify(constraints.map((c) => ({ ...c })));

  useEffect(() => {
    if (!enabled) {
      setState({ data: [], loading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, loading: true }));
    const unsub = subscribe<T>(
      name,
      (rows) => setState({ data: rows, loading: false, error: null }),
      (err) => setState({ data: [], loading: false, error: err }),
      ...constraints,
    );
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, key, enabled]);

  return state;
}

interface DocState<T> {
  data: WithId<T> | null;
  loading: boolean;
  error: Error | null;
}

export function useDocument<T extends DocumentData>(
  name: CollectionName,
  id: string | null | undefined,
  options: { enabled?: boolean } = {},
): DocState<T> {
  const enabled = (options.enabled ?? true) && Boolean(id);
  const [state, setState] = useState<DocState<T>>({
    data: null,
    loading: enabled,
    error: null,
  });

  useEffect(() => {
    if (!enabled || !id) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, loading: true }));
    const unsub = subscribeOne<T>(
      name,
      id,
      (row) => setState({ data: row, loading: false, error: null }),
      (err) => setState({ data: null, loading: false, error: err }),
    );
    return () => unsub();
  }, [name, id, enabled]);

  return state;
}
