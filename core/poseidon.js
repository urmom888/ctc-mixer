import { buildPoseidon } from "circomlibjs";
let poseidon = null;
let F = null;
export async function initPoseidon() {
    if (!poseidon) {
        poseidon = await buildPoseidon();
        F = poseidon.F;
    }
}
export function poseidonHash(inputs) {
    if (!poseidon)
        throw new Error("call initPoseidon() first");
    return F.toObject(poseidon(inputs.map((x) => F.e(x))));
}
