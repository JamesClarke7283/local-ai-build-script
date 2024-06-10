#!/usr/bin/env bun
import { $ } from "bun";
import { existsSync } from "fs";
import { config } from "dotenv";
// Load environment variables from .env file
config();

try {
    await $`dpkg -s intel-basekit`;
    console.log("intel-basekit is already installed.");
} catch {
    if (!existsSync("/usr/share/keyrings/oneapi-archive-keyring.gpg")) {
        await $`wget -O build/intel-gpg-keys.GPG-PUB-KEY-INTEL-SW-PRODUCTS.PUB https://apt.repos.intel.com/intel-gpg-keys/GPG-PUB-KEY-INTEL-SW-PRODUCTS.PUB`;
        await $`gpg --dearmor < build/intel-gpg-keys.GPG-PUB-KEY-INTEL-SW-PRODUCTS.PUB | sudo tee /usr/share/keyrings/oneapi-archive-keyring.gpg > /dev/null`;
    } else {
        console.log("Intel keyring already exists.");
    }
    await $`echo "deb [signed-by=/usr/share/keyrings/oneapi-archive-keyring.gpg] https://apt.repos.intel.com/oneapi all main" | sudo tee /etc/apt/sources.list.d/oneAPI.list`;
    await $`sudo apt update`;
    await $`sudo apt install -y intel-basekit`;
}
