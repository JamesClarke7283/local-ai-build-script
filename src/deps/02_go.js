#!/usr/bin/env bun
import { $ } from "bun";
import { existsSync, unlinkSync } from "fs";
import { compareVersions, verifyChecksum } from "../lib/utils.js";
import { fetch_go_releases } from "../lib/fetch_deps.js";
import { config } from "dotenv";

// Load environment variables from .env file
config();

// Get the architecture from the environment variables
const arch = process.env.ARCH;
if (!arch) {
    console.error("ARCH environment variable is not set.");
    process.exit(1);
}

let goTarball, goTarballUrl, goTarballChecksum;

// Fetch the Go releases and find the relevant release for the architecture
const releases = await fetch_go_releases();
if (releases.length > 0) {
    const release = releases[0]; // Assuming the first release is the latest stable version
    const file = release.files.find(file => file.arch === arch);
    if (file) {
        goTarball = file.filename;
        goTarballUrl = file.url;
        goTarballChecksum = file.sha256;
    } else {
        console.error(`No Go release found for architecture ${arch}.`);
        process.exit(1);
    }
} else {
    console.error("No Go releases found.");
    process.exit(1);
}

let goVersionInstalled = null;
try {
    goVersionInstalled = await $`go version`.text().then(output => output.split(' ')[2].substring(2));
} catch (error) {
    console.log("Go is not installed. Installing Go...");
    if (!existsSync(`build/${goTarball}`)) {
        await $`wget -P build/ ${goTarballUrl}`;
    } else {
        console.log(`${goTarball} already exists in build/, verifying checksum...`);
    }

    if (!await verifyChecksum(`build/${goTarball}`, goTarballChecksum)) {
        console.log("Checksum verification failed, re-downloading tarball...");
        unlinkSync(`build/${goTarball}`);
        await $`wget -P build/ ${goTarballUrl}`;
    }

    await $`sudo rm -rf /usr/local/go`;
    await $`sudo tar -C /usr/local -xzf build/${goTarball}`;
    process.env.PATH = `${process.env.PATH}:/usr/local/go/bin`;
}

const goVersionRequired = "1.21";
if (goVersionInstalled) {
    if (compareVersions(goVersionInstalled, goVersionRequired) >= 0) {
        console.log(`Installed Go version (${goVersionInstalled}) is sufficient.`);
    } else {
        console.log(`Installed Go version (${goVersionInstalled}) is too old. Installing latest Go version...`);
        await $`sudo apt remove golang -y`;
        if (!existsSync(`build/${goTarball}`)) {
            await $`wget -P build/ ${goTarballUrl}`;
        }
        console.log("Verifying Go Download Checksum...");

        if (!await verifyChecksum(`build/${goTarball}`, goTarballChecksum)) {
            console.log("Checksum verification failed, re-downloading tarball...");
            unlinkSync(`build/${goTarball}`);
            await $`wget -P build/ ${goTarballUrl}`;
        }
        console.log("Removing old Go install...");
        await $`sudo rm -rf /usr/local/go`;
        console.log("Unpacking new Go install");
        await $`sudo tar -C /usr/local -xzf build/${goTarball}`;
        process.env.PATH = `${process.env.PATH}:/usr/local/go/bin`;
    }
}
