"use client";

import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { getFirebaseStorage } from "./client";

/**
 * Upload a file to Firebase Storage and return its download URL.
 * `path` examples: `shipments/{id}/photos`, `complaints/{ticket}`.
 */
export async function uploadFile(path: string, file: File): Promise<string> {
  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const storageRef = ref(getFirebaseStorage(), `${path}/${safeName}`);
  await uploadBytes(storageRef, file, { contentType: file.type });
  return getDownloadURL(storageRef);
}

export async function uploadFiles(path: string, files: FileList | File[]): Promise<string[]> {
  const arr = Array.from(files);
  return Promise.all(arr.map((f) => uploadFile(path, f)));
}

export async function deleteFileByUrl(url: string): Promise<void> {
  try {
    const storageRef = ref(getFirebaseStorage(), url);
    await deleteObject(storageRef);
  } catch {
    // Ignore — file may already be gone.
  }
}
