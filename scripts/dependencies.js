#!/usr/bin/env bun
import { readdir } from "fs/promises";
import { join } from "path";
import { $ } from "bun";

async function runDependencies() {
  const scriptsDir = join(process.cwd(), "scripts/deps");
  const scripts = (await readdir(scriptsDir)).filter(file => file.endsWith(".js")).sort();

  for (const [index, script] of scripts.entries()) {
    console.log(`Running Dependencies Check (Stage ${index + 1}/${scripts.length}): ${script}`);
    try {
      await $`bun run ${join(scriptsDir, script)}`;
    } catch (error) {
      console.error(`Error running ${script}:`, error);
      process.exit(1);
    }
  }
  console.log("All dependency checks completed successfully.");
}

runDependencies();