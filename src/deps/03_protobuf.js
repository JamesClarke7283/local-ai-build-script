#!/usr/bin/env bun
import { $ } from "bun";
import { existsSync } from "fs";
import { compareVersions, verifyChecksum } from "../lib/utils.js";
import { config } from "dotenv";
// Load environment variables from .env file
config();

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

await $`go install google.golang.org/protobuf/cmd/protoc-gen-go@v1.34.0`;
await $`go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@8ba23be9613c672d40ae261d2a1335d639bdd59b`;
