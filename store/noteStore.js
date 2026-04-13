const DB = "mixer-notes";
const STORE = "notes";
function open() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB, 1);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE)) {
                db.createObjectStore(STORE, { keyPath: "id" });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}
export async function saveNote(note) {
    const db = await open();
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(note);
    return new Promise((res, rej) => {
        tx.oncomplete = () => res();
        tx.onerror = () => rej(tx.error);
    });
}
export async function getAllNotes() {
    const db = await open();
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    return new Promise((res, rej) => {
        req.onsuccess = () => res(req.result);
        req.onerror = () => rej(req.error);
    });
}
export async function updateNoteStatus(id, status, txHash) {
    const db = await open();
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const req = store.get(id);
    req.onsuccess = () => {
        const note = req.result;
        if (note) {
            note.status = status;
            if (txHash) {
                if (status === "deposited")
                    note.depositTx = txHash;
                if (status === "withdrawn")
                    note.withdrawTx = txHash;
            }
            store.put(note);
        }
    };
}
export async function exportNotes() {
    const notes = await getAllNotes();
    return JSON.stringify(notes, null, 2);
}
export async function importNotes(json) {
    const notes = JSON.parse(json);
    for (const n of notes)
        await saveNote(n);
    return notes.length;
}
