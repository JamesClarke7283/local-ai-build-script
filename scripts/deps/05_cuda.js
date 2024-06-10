#!/usr/bin/env bun
import { $ } from "bun";
import { existsSync } from "fs";

const cudaVersion = "12-3";

try {
    await $`dpkg -s cuda-nvcc-${cudaVersion}`;
    await $`dpkg -s libcublas-dev-${cudaVersion}`;
    console.log("CUDA packages are already installed.");
} catch {
    if (!existsSync("/usr/share/keyrings/cuda-keyring.gpg")) {
        const cudaKeyring = "cuda-keyring_1.1-1_all.deb";
        if (!existsSync("build/" + cudaKeyring)) {
            await $`curl -o build/${cudaKeyring} https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2204/x86_64/${cudaKeyring}`;
        }
        await $`sudo dpkg -i build/${cudaKeyring}`;
    } else {
        console.log("CUDA keyring already exists.");
    }
    await $`sudo apt-get update`;
    await $`sudo apt-get install -y cuda-nvcc-${cudaVersion} libcublas-dev-${cudaVersion}`;
}
