import nextEnv from "@next/env";
import initialPhrases from "../data/initial-phrases.json";
import { getPhraseRepository } from "../src/lib/phrases";

// Match Next.js environment precedence; exported variables take priority.
nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

try {
  const seeded = await getPhraseRepository().seed(initialPhrases);
  console.log(seeded ? "Initialized bingo configuration at version 1." : "Configuration already exists; no changes made.");
} catch {
  console.error("Seeding failed. Check server database configuration, migrations, and connectivity. Existing configuration was not replaced.");
  process.exitCode = 1;
}
