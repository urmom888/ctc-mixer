import { poseidonHash } from "./poseidon";
import { randomBytes, bytesToBigInt } from "./crypto";
import { toNoteString } from "./note";
export function createDeposit(amount, chainId) {
    const nullifier = randomBytes(31);
    const secret = randomBytes(31);
    const nBig = bytesToBigInt(nullifier);
    const sBig = bytesToBigInt(secret);
    const commitment = poseidonHash([nBig, sBig]);
    const nullifierHash = poseidonHash([nBig]);
    const note = toNoteString({ amount, chainId, nullifier, secret });
    return { nullifier, secret, commitment, nullifierHash, note };
}
