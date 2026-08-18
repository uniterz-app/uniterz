/**
 * MARK リストのプロセス内ストア。
 * 自分プロフィールと他人プロフィールは別スクリーンなので、
 * ここを経由しないと外す／付け直すがリストに届かない。
 */
import type { UserMark } from "./markTypes";

const EMPTY: UserMark[] = [];
const listeners = new Set<() => void>();

let ownerUid = "";
let marks: UserMark[] = EMPTY;
let hydrated = false;
let writeEpoch = 0;
let snapshot: {
  owner: string;
  marks: UserMark[];
  hydrated: boolean;
} = { owner: "", marks: EMPTY, hydrated: false };

function emit() {
  snapshot = { owner: ownerUid, marks, hydrated };
  listeners.forEach((fn) => fn());
}

export function subscribeMarksMemory(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

export function getMarksMemorySnapshot(): {
  owner: string;
  marks: UserMark[];
  hydrated: boolean;
} {
  return snapshot;
}

export function peekMarksWriteEpoch(): number {
  return writeEpoch;
}

export function beginMarksWrite(): number {
  writeEpoch += 1;
  return writeEpoch;
}

export function resetMarksMemory() {
  if (!ownerUid && !hydrated && marks === EMPTY) return;
  ownerUid = "";
  marks = EMPTY;
  hydrated = false;
  writeEpoch += 1;
  emit();
}

export function hydrateMarksMemory(
  uid: string,
  rows: UserMark[],
  epoch: number
) {
  const owner = uid.trim();
  if (!owner) return;
  if (epoch !== writeEpoch) return;
  ownerUid = owner;
  marks = rows;
  hydrated = true;
  emit();
}

export function addMarkInMemory(
  uid: string,
  row: UserMark,
  maxMarks: number
): UserMark[] | "cap" {
  const owner = uid.trim();
  if (!owner) return EMPTY;
  ownerUid = owner;
  const without = marks.filter((m) => m.targetUid !== row.targetUid);
  if (without.length >= maxMarks) return "cap";
  marks = [row, ...without];
  hydrated = true;
  emit();
  return marks;
}

export function removeMarkInMemory(uid: string, targetUid: string): UserMark[] {
  const owner = uid.trim();
  const target = targetUid.trim();
  if (!owner) return EMPTY;
  ownerUid = owner;
  marks = marks.filter((m) => m.targetUid !== target);
  hydrated = true;
  emit();
  return marks;
}

export function replaceMarksMemory(uid: string, rows: UserMark[]) {
  const owner = uid.trim();
  if (!owner) return;
  ownerUid = owner;
  marks = rows;
  hydrated = true;
  emit();
}
