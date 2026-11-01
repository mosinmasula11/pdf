import { validateLatexProject, type LatexProject } from "./latex-project";
function database() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("msyn-latex", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("projects");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function loadLatexProject(): Promise<LatexProject | null> {
  const db = await database();
  try { return await new Promise((resolve, reject) => {
    const request = db.transaction("projects").objectStore("projects").get("current");
    request.onsuccess = () => { try { resolve(request.result ? validateLatexProject(request.result) : null); } catch (error) { reject(error); } };
    request.onerror = () => reject(request.error);
  }); } finally { db.close(); }
}
export async function saveLatexProject(project: LatexProject) {
  const db = await database();
  try { await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction("projects", "readwrite");
    transaction.objectStore("projects").put(project, "current");
    transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error); transaction.onabort = () => reject(transaction.error);
  }); } finally { db.close(); }
}
