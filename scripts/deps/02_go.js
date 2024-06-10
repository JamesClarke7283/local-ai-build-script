#!/usr/bin/env bun
import { $ } from "bun";
import { existsSync, unlinkSync } from "fs";
import { compareVersions, verifyChecksum } from "../lib/utils.js";

process.env.GOROOT = '/usr/local/go';
process.env.GOPATH = `${process.env.HOME}/go`;
process.env.PATH = `${process.env.PATH}:${process.env.GOROOT}/bin:${process.env.GOPATH}/bin:${process.env.HOME}/.local/bin`;

const goTarball = "go1.22.4.linux-amd64.tar.gz";
const goTarballUrl = `https://go.dev/dl/${goTarball}`;
const goTarballChecksum = "ba79d4526102575196273416239cca418a651e049c2b099f3159db85e7bade7d"; // Replace with the actual checksum

let goVersionInstalled = null;
try {
    goVersionInstalled = await $`go version`.text().then(output => output.split(' ')[2].substring(2));
} catch (error) {
    console.log("Go is not installed. Installing Go 1.22.4...");
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
        console.log(`Installed Go version (${goVersionInstalled}) is too old. Installing Go 1.22.4...`);
        await $`sudo apt remove golang -y`;
        if (!existsSync(`build/${goTarball}`)) {
            await $`wget -P build/ ${goTarballUrl}`;
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
}
