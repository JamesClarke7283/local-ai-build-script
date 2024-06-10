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
    const fileBuffer = await readFileAsync(filePath);
    const hash = createHash('sha256').update(fileBuffer).digest('hex');
    return hash === expectedChecksum;
};
