#!/usr/bin/env bun
import { $ } from "bun";

await $`bun run scripts/dependencies.js`;
await $`bun run scripts/compile.js`;