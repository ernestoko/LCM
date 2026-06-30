import { format, formatDistanceToNow, isValid, parseISO, differenceInDays } from "date-fns";
import type { ISODate } from "@/types";

export function toISO(d: Date | string | number | null | undefined): ISODate {
  if (!d) return new Date().toISOString();
  if (typeof d === "string") return d;
  return new Date(d).toISOString();
}

/** Today's date as a plain `YYYY-MM-DD` string — handy for filenames and date inputs. */
export function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

function asDate(d?: ISODate | null): Date | null {
  if (!d) return null;
  const parsed = typeof d === "string" ? parseISO(d) : new Date(d);
  return isValid(parsed) ? parsed : null;
}

export function formatDate(d?: ISODate | null, pattern = "dd MMM yyyy"): string {
  const date = asDate(d);
  return date ? format(date, pattern) : "—";
}

export function formatDateTime(d?: ISODate | null): string {
  const date = asDate(d);
  return date ? format(date, "dd MMM yyyy, h:mm a") : "—";
}

export function fromNow(d?: ISODate | null): string {
  const date = asDate(d);
  return date ? formatDistanceToNow(date, { addSuffix: true }) : "—";
}

export function daysBetween(a?: ISODate | null, b?: ISODate | null): number | null {
  const da = asDate(a);
  const db = asDate(b);
  if (!da || !db) return null;
  return differenceInDays(db, da);
}

/** Is `effective` <= now <= `expiry` (expiry optional). */
export function isWithinWindow(effective?: ISODate, expiry?: ISODate): boolean {
  const now = Date.now();
  const eff = asDate(effective);
  const exp = asDate(expiry);
  if (eff && eff.getTime() > now) return false;
  if (exp && exp.getTime() < now) return false;
  return true;
}

export function addMonths(d: ISODate, months: number): ISODate {
  const date = asDate(d) ?? new Date();
  const out = new Date(date);
  out.setMonth(out.getMonth() + months);
  return out.toISOString();
}
