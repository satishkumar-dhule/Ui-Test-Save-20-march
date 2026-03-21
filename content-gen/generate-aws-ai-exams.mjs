// AWS AI Practitioner batch exam generator
// This script delegates to the main content generator to produce 100 exam questions
// for the AWS AI Practitioner channel (aws-ai) and persists them to the DB via the agent paths.
import path from "path";
import { fileURLToPath } from "url";
import { spawn, execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const generatorPath = path.resolve(__dirname, "generate-content.mjs");

async function main() {
  console.log(
    "Starting batch AWS AI Practitioner exam generation (aws-ai, 100 items)",
  );
  // Detect Bun availability and prepare environment for the underlying generator
  let bunPath = null;
  try {
    bunPath = execSync("command -v bun").toString().trim();
  } catch {
    bunPath = null;
  }
  const env = {
    ...process.env,
    TARGET_CHANNEL: "aws-ai",
    CONTENT_TYPE: "exam",
    COUNT: "100",
  };

  const useBun = !!bunPath;
  const runner = useBun ? bunPath : process.execPath;
  const args = useBun ? [generatorPath] : [generatorPath];
  const child = spawn(runner, args, {
    env,
    stdio: "inherit",
    cwd: path.resolve(__dirname, "..", ".."), // cwd to repo root as other scripts expect
  });

  return new Promise((resolve, reject) => {
    child.on("error", (err) => {
      console.error("Failed to start generator:", err);
      reject(err);
    });
    child.on("close", (code) => {
      if (code === 0) {
        console.log("AWS AI Practitioner exam generation completed.");
        resolve(0);
      } else {
        console.error(`Generator exited with code ${code}`);
        reject(new Error("Generator failed"));
      }
    });
  });
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Batch generation error:", err);
    process.exit(1);
  });
