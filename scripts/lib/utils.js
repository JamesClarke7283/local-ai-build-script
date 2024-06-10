import { createHash } from "crypto";
import { promisify } from "util";
import { readFile } from "fs/promises";

const readFileAsync = promisify(readFile);

export const compareVersions = (versionA, versionB) => {
    const [a, b] = [versionA.split('.').map(Number), versionB.split('.').map(Number)];
    for (let i = 0; i < a.length; i++) {
        if (a[i] > b[i]) return 1;
        if (a[i] < b[i]) return -1;
    }
    return 0;
};

export const verifyChecksum = async (filePath, expectedChecksum) => {
    try {
        const result = await $`sha256sum ${filePath}`.text();
        const [hash] = result.split(" ");
        return hash === expectedChecksum;
    } catch (error) {
        console.error(`Failed to verify checksum: ${error.message}`);
        return false;
    }
};
