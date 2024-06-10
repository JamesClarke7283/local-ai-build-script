#!/usr/bin/env bun

import { $ } from "bun";
import { existsSync, chdir } from "fs";

// Set environment variables for Go and ensure they are available
process.env.GOROOT = '/usr/local/go';
process.env.GOPATH = `${process.env.HOME}/go`;
process.env.PATH = `${process.env.PATH}:${process.env.GOROOT}/bin:${process.env.GOPATH}/bin`;

// Clone the repository if it doesn't exist
const repoPath = 'src/LocalAI';

if (!existsSync(repoPath)) {
    console.log('Cloning repository...');
    await $`git clone --recursive --depth 1 https://github.com/mudler/LocalAI.git ${repoPath}`;
} else {
    console.log('LocalAI directory already exists in src/, skipping clone.');
}

chdir(repoPath);

// Ensure protoc is installed correctly and check its version
try {
    const protocVersion = await $`protoc --version`.text();
    console.log(`protoc version: ${protocVersion}`);
} catch (error) {
    console.error('protoc is not installed or not in the PATH. Please ensure it is installed.');
    process.exit(1);
}

// Set GO_TAGS and BUILD_TYPE
process.env.GO_TAGS = 'p2p stablediffusion tts';
process.env.BUILD_TYPE = 'cublas';

// Build the project
await $`make -j4 dist`;
