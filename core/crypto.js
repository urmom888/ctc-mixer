export function randomBytes(n) {
    const buf = new Uint8Array(n);
    crypto.getRandomValues(buf);
    return buf;
}
export function bytesToBigInt(bytes) {
    return BigInt("0x" + Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join(""));
}
export function bigIntToBytes(n, len) {
    const hex = n.toString(16).padStart(len * 2, "0");
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++)
        bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    return bytes;
}
