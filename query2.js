import { Database } from "bun:sqlite";
const paths = [
  "/home/runner/workspace/artifacts/data/devprep.db",
  "/home/runner/workspace/artifacts/devprep/devprep.db",
  "/home/runner/workspace/data/devprep.db",
];
for (const dbPath of paths) {
  console.log(`\n=== ${dbPath} ===`);
  try {
    const db = new Database(dbPath);
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all();
    console.log(
      "Tables:",
      tables.map((t) => t.name),
    );
    if (tables.some((t) => t.name === "contents")) {
      const devops = db
        .prepare("SELECT * FROM channels WHERE id = 'devops'")
        .get();
      console.log("Channel devops:", devops);
      const contentCount = db
        .prepare(
          "SELECT COUNT(*) as count FROM contents WHERE channel_id = 'devops'",
        )
        .get();
      console.log("Devops content count:", contentCount);
      const content = db
        .prepare(
          "SELECT id, channel_id, content_type, status, tags FROM contents WHERE channel_id = 'devops' LIMIT 3",
        )
        .all();
      console.log("Sample devops content:", content);
    } else if (tables.some((t) => t.name === "generated_content")) {
      const contentCount = db
        .prepare(
          "SELECT COUNT(*) as count FROM generated_content WHERE channel_id = 'devops'",
        )
        .get();
      console.log("Generated content devops count:", contentCount);
      const content = db
        .prepare(
          "SELECT id, channel_id, content_type, status, data FROM generated_content WHERE channel_id = 'devops' LIMIT 1",
        )
        .all();
      if (content.length > 0) {
        console.log("Sample record:", content[0]);
        console.log("Data field length:", content[0].data?.length);
        console.log("Data preview:", content[0].data?.slice(0, 200));
      }
    }
    db.close();
  } catch (e) {
    console.log("Error:", e.message);
  }
}
