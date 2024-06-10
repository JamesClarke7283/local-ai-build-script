#!/usr/bin/env bun
import { $ } from "bun";

await $`bun run src/dependencies.js`;
await $`bun run src/compile.js`;
