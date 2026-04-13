import { poseidonHash } from "./poseidon";
import { TREE_DEPTH, ZERO_VALUE } from "../config/constants";
/**
 * Incremental Merkle tree — mirrors on-chain MerkleTreeWithHistory._insert exactly.
 * Path siblings are recorded at insert time for the last inserted leaf.
 */
export class MerkleTree {
    depth;
    leaves = [];
    zeros;
    filledSubtrees;
    root;
    lastPath = null;
    constructor(depth = TREE_DEPTH) {
        this.depth = depth;
        this.zeros = [ZERO_VALUE];
        for (let i = 1; i <= depth; i++) {
            this.zeros.push(poseidonHash([this.zeros[i - 1], this.zeros[i - 1]]));
        }
        this.filledSubtrees = this.zeros.slice(0, depth);
        this.root = this.zeros[depth];
    }
    insert(leaf) {
        const idx = this.leaves.length;
        this.leaves.push(leaf);
        const pathElements = [];
        const pathIndices = [];
        let ci = idx;
        let cur = leaf;
        for (let i = 0; i < this.depth; i++) {
            let l, r;
            if (ci % 2 === 0) {
                l = cur;
                r = this.filledSubtrees[i];
                pathElements.push(this.filledSubtrees[i]);
                this.filledSubtrees[i] = cur;
            }
            else {
                l = this.filledSubtrees[i];
                r = cur;
                pathElements.push(this.filledSubtrees[i]);
            }
            pathIndices.push(ci % 2);
            cur = poseidonHash([l, r]);
            ci = Math.floor(ci / 2);
        }
        this.root = cur;
        this.lastPath = { pathElements, pathIndices };
        return idx;
    }
    getRoot() {
        return this.root;
    }
    /**
     * Get Merkle path for a leaf.
     * Only the path for the LAST inserted leaf is guaranteed correct
     * (since incremental insert modifies filledSubtrees).
     * For earlier leaves, use getPathForLastLeaf() after inserting all leaves.
     */
    getPath(leafIndex) {
        if (leafIndex === this.leaves.length - 1 && this.lastPath) {
            return this.lastPath;
        }
        // For non-last leaves, rebuild incrementally up to that point
        return this.recomputePath(leafIndex);
    }
    /**
     * Replay inserts to get the path AND root at the moment the target leaf was inserted.
     * This root is valid on-chain (stored in roots[] history).
     */
    recomputePathWithRoot(leafIndex) {
        const fs = this.zeros.slice(0, this.depth);
        let targetPath = null;
        let targetRoot = 0n;
        for (let idx = 0; idx < this.leaves.length; idx++) {
            const pe = [];
            const pi = [];
            let ci = idx;
            let cur = this.leaves[idx];
            for (let i = 0; i < this.depth; i++) {
                let l, r;
                if (ci % 2 === 0) {
                    l = cur;
                    r = fs[i];
                    pe.push(fs[i]);
                    fs[i] = cur;
                }
                else {
                    l = fs[i];
                    r = cur;
                    pe.push(fs[i]);
                }
                pi.push(ci % 2);
                cur = poseidonHash([l, r]);
                ci = Math.floor(ci / 2);
            }
            if (idx === leafIndex) {
                targetPath = { pathElements: pe, pathIndices: pi };
                targetRoot = cur;
            }
        }
        return { ...targetPath, root: targetRoot };
    }
    findLeafIndex(leaf) {
        return this.leaves.findIndex((l) => l === leaf);
    }
    static fromCommitments(commitments, depth = TREE_DEPTH) {
        const t = new MerkleTree(depth);
        for (const c of commitments)
            t.insert(c);
        return t;
    }
}
