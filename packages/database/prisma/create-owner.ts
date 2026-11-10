import { config } from "dotenv";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";
import { createPrismaClient, createOwnerAccount } from "../src/index.js";

config({ path: fileURLToPath(new URL("../../../.env", import.meta.url)) });
if (!process.env.DATABASE_URL) {
  config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });
}

function printHelp(): void {
  process.stdout.write(
    [
      "Usage: pnpm owner:create",
      "",
      "Interactively create the single V1 owner account and personal workspace.",
      "Email is visible while entered; password input is hidden.",
      "The command refuses to run if an owner already exists.",
      "DATABASE_URL must be configured in the environment or packages/database/.env."
    ].join("\n") + "\n"
  );
}

async function promptHidden(prompt: string): Promise<string> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error("Hidden password input requires an interactive terminal");
  }

  process.stdout.write(prompt);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding("utf8");

  return new Promise((resolve, reject) => {
    let value = "";
    const restore = (): void => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeListener("data", onData);
    };
    const onData = (chunk: string): void => {
      for (const character of chunk) {
        if (character === "\u0003") {
          restore();
          process.stdout.write("\n");
          reject(new Error("Owner initialization cancelled"));
          return;
        }
        if (character === "\r" || character === "\n") {
          restore();
          process.stdout.write("\n");
          resolve(value);
          return;
        }
        if (character === "\u007f" || character === "\b") {
          value = value.slice(0, -1);
          continue;
        }
        value += character;
      }
    };
    process.stdin.on("data", onData);
  });
}

async function main(): Promise<void> {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    printHelp();
    return;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl === undefined || databaseUrl === "") {
    throw new Error("DATABASE_URL is required");
  }

  const terminal = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const email = await terminal.question("Owner email: ");
    const displayName = await terminal.question("Display name (optional): ");
    terminal.close();

    const password = await promptHidden("Owner password (12+ chars, hidden): ");
    const confirmation = await promptHidden("Confirm password (hidden): ");
    if (password !== confirmation) {
      throw new Error("Passwords do not match");
    }

    const prisma = createPrismaClient(databaseUrl);
    try {
      const owner = await createOwnerAccount(prisma, { email, password, displayName });
      process.stdout.write(
        `Owner initialized: ${owner.email} (user ${owner.userId}, workspace ${owner.workspaceId})\n`
      );
    } finally {
      await prisma.$disconnect();
    }
  } finally {
    terminal.close();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Owner initialization failed";
  process.stderr.write(`Owner initialization failed: ${message}\n`);
  process.exitCode = 1;
});
