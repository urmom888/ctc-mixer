export function toNoteString(d) {
    const pre = new Uint8Array([...d.nullifier, ...d.secret]);
    const hex = Array.from(pre).map(b => b.toString(16).padStart(2, "0")).join("");
    return `mixer-ctc-${d.amount}-${d.chainId}-0x${hex}`;
}
export function validateNote(s) {
    return /^mixer-ctc-[\d.]+-\d+-0x[0-9a-fA-F]{124}$/.test(s.trim());
}
export function parseNote(s) {
    const m = s.match(/^mixer-ctc-([\d.]+)-(\d+)-0x([0-9a-fA-F]{124})$/);
    if (!m)
        throw new Error("Invalid note format");
    const bytes = new Uint8Array(62);
    for (let i = 0; i < 62; i++)
        bytes[i] = parseInt(m[3].slice(i * 2, i * 2 + 2), 16);
    return { amount: m[1], chainId: parseInt(m[2]), nullifier: bytes.slice(0, 31), secret: bytes.slice(31, 62) };
}
