#!/usr/bin/env bun
import { $ } from "bun";
import { existsSync } from "fs";

const compareVersions = (versionA, versionB) => {
    const [a, b] = [versionA.split('.').map(Number), versionB.split('.').map(Number)];
    for (let i = 0; i < a.length; i++) {
        if (a[i] > b[i]) return 1;
        if (a[i] < b[i]) return -1;
    }
    return 0;
}

const protocVersionRequired = "3.12.0";
const protocZip = "protoc-25.1-linux-x86_64.zip";
const protocUrl = `https://github.com/protocolbuffers/protobuf/releases/download/v25.1/${protocZip}`;
const protocInstallDir = `${process.env.HOME}/.local`;

try {
    const protocVersionInstalled = await $`protoc --version`.text().then(output => output.split(' ')[1]);
    if (compareVersions(protocVersionInstalled, protocVersionRequired) >= 0) {
        console.log(`Installed protobuf version (${protocVersionInstalled}) is sufficient.`);
    } else {
        console.log(`Installed protobuf version (${protocVersionInstalled}) is too old. Removing and installing newer version...`);
        await $`sudo apt remove protobuf-compiler -y`;
        if (!existsSync("build/" + protocZip)) {
            await $`curl -L -o build/${protocZip} ${protocUrl}`;
        }
        await $`unzip -o build/${protocZip} -d ${protocInstallDir}`;
    }
} catch {
    console.log("Protobuf compiler is not installed. Installing...");
    if (!existsSync("build/" + protocZip)) {
        await $`curl -L -o build/${protocZip} ${protocUrl}`;
    }
    await $`unzip -o build/${protocZip} -d ${protocInstallDir}`;
}

process.env.PATH = `${process.env.PATH}:${protocInstallDir}/bin`;
await $`go install google.golang.org/protobuf/cmd/protoc-gen-go@v1.34.0`;
await $`go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@8ba23be9613c672d40ae261d2a1335d639bdd59b`;
process.env.PATH = `${process.env.PATH}:${process.env.GOPATH}/bin`;
process.env.PATH = `${process.env.PATH}:/usr/local/cuda/bin`;
await $`source /opt/intel/oneapi/setvars.sh`;
