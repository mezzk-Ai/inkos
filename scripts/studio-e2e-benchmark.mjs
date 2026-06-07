#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CASES_PATH = resolve(__dirname, "studio-e2e-benchmark-cases.json");

function usage() {
  return [
    "Usage:",
    "  node scripts/studio-e2e-benchmark.mjs list",
    "  node scripts/studio-e2e-benchmark.mjs markdown [output.md]",
    "",
    "This script does not call LLMs. It materializes the fixed Studio real-model",
    "E2E benchmark run sheet so a human or browser automation can run it with",
    "the configured Studio model service.",
  ].join("\n");
}

async function loadCases() {
  return JSON.parse(await readFile(CASES_PATH, "utf-8"));
}

function flattenCases(spec) {
  return spec.categories.flatMap((category) =>
    category.cases.map((testCase) => ({
      category,
      testCase,
    })),
  );
}

function renderList(spec) {
  const lines = [
    `${spec.name} v${spec.version}`,
    `Default text model: ${spec.defaultModelHint?.text ?? "(project config)"}`,
    `Default cover model: ${spec.defaultModelHint?.cover ?? "(project config)"}`,
    "",
  ];
  for (const { category, testCase } of flattenCases(spec)) {
    lines.push(`${testCase.id} [${category.label}] ${testCase.prompt}`);
  }
  return lines.join("\n");
}

function renderMarkdown(spec) {
  const lines = [
    `# ${spec.name}`,
    "",
    `Version: ${spec.version}`,
    "",
    spec.purpose,
    "",
    `- Text model hint: ${spec.defaultModelHint?.text ?? "(project config)"}`,
    `- Cover model hint: ${spec.defaultModelHint?.cover ?? "(project config)"}`,
    "",
  ];

  for (const category of spec.categories) {
    lines.push(`## ${category.label}`);
    lines.push("");
    lines.push(`Entry: ${category.entry}`);
    lines.push("");
    for (const testCase of category.cases) {
      lines.push(`### ${testCase.id}`);
      lines.push("");
      lines.push(`Prompt: ${testCase.prompt}`);
      lines.push("");
      lines.push("Acceptance:");
      for (const item of testCase.acceptance) {
        lines.push(`- [ ] ${item}`);
      }
      lines.push("");
      lines.push("Result:");
      lines.push("- Status: TODO");
      lines.push("- Artifact: ");
      lines.push("- Notes: ");
      lines.push("");
    }
  }
  return lines.join("\n");
}

const command = process.argv[2] ?? "list";
const output = process.argv[3];

const spec = await loadCases();

if (command === "list") {
  console.log(renderList(spec));
} else if (command === "markdown") {
  const markdown = renderMarkdown(spec);
  if (output) {
    await writeFile(resolve(process.cwd(), output), markdown, "utf-8");
  } else {
    console.log(markdown);
  }
} else {
  console.error(usage());
  process.exitCode = 1;
}
