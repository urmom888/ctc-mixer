import { parseNote } from "./note";
import { bytesToBigInt } from "./crypto";
import { poseidonHash } from "./poseidon";
export function buildWithdrawInput(noteStr, tree, recipient, relayer, fee, refund = 0n) {
    const note = parseNote(noteStr);
    const nullifierBig = bytesToBigInt(note.nullifier);
    const secretBig = bytesToBigInt(note.secret);
    const commitment = poseidonHash([nullifierBig, secretBig]);
    const nullifierHash = poseidonHash([nullifierBig]);
    const leafIndex = tree.findLeafIndex(commitment);
    if (leafIndex < 0) {
        throw new Error("Commitment not found in Merkle tree");
    }
    // Get path and the root at the time of insertion (both are valid on-chain)
    const { pathElements, pathIndices, root } = tree.recomputePathWithRoot(leafIndex);
    // Convert address to uint256 (strip 0x, parse as hex)
    const recipientBig = BigInt(recipient);
    const relayerBig = relayer === "0x0000000000000000000000000000000000000000"
        ? 0n
        : BigInt(relayer);
    return {
        root: root.toString(),
        nullifierHash: nullifierHash.toString(),
        recipient: recipientBig.toString(),
        relayer: relayerBig.toString(),
        fee: fee.toString(),
        refund: refund.toString(),
        nullifier: nullifierBig.toString(),
        secret: secretBig.toString(),
        pathElements: pathElements.map((e) => e.toString()),
        pathIndices: pathIndices.map((e) => e.toString()),
    };
}
