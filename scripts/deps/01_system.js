#!/usr/bin/env bun
import { $ } from "bun";
import { existsSync, mkdirSync } from "fs";

if (!existsSync("src")) mkdirSync("src");
if (!existsSync("build")) mkdirSync("build");

const dependencies = ["software-properties-common", "wget", "curl", "build-essential", "ffmpeg", "ccache", "cmake", "unzip"];
for (const pkg of dependencies) {
    try {
        await $`dpkg -s ${pkg}`;
        console.log(`${pkg} is already installed.`);
    } catch {
        await $`sudo apt-get update`;
        await $`sudo apt-get install -y ${pkg}`;
    }
}
