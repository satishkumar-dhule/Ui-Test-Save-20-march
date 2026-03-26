import { Database } from "bun:sqlite";
const db = new Database("/home/runner/workspace/artifacts/data/devprep.db");
console.log("Tables:");
const tables = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table'")
  .all();
console.log(tables.map((t) => t.name));
console.log("\nChannel devops exists?");
const devops = db.prepare("SELECT * FROM channels WHERE id = 'devops'").get();
console.log(devops);
console.log("\nContent for devops channel (first 5):");
const content = db
  .prepare(
    "SELECT id, channel_id, content_type, status, tags, length(data) as data_len FROM contents WHERE channel_id = 'devops' LIMIT 5",
  )
  .all();
console.log(content);
console.log("\nContent with tags containing devops (first 5):");
const tagContent = db
  .prepare(
    "SELECT c.id, c.channel_id, c.content_type, c.status, c.tags FROM contents c JOIN content_tags t ON c.id = t.content_id WHERE t.tag = 'devops' LIMIT 5",
  )
  .all();
console.log(tagContent);
console.log("\nAll channel IDs in contents:");
const channelIds = db.prepare("SELECT DISTINCT channel_id FROM contents").all();
console.log(channelIds);
db.close();
