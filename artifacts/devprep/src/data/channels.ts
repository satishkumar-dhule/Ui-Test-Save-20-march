export interface Channel {
  id: string;
  name: string;
  shortName: string;
  emoji: string;
  color: string;
  type: "tech" | "cert";
  certCode?: string;
  description: string;
  tagFilter?: string[];
}

// The DB is the single source of truth for channels.
// This static list is intentionally empty — the useChannels hook
// populates the app from data/devprep.db via sql.js at runtime.
export const channels: Channel[] = [];

export const techChannels = channels.filter(c => c.type === "tech");
export const certChannels = channels.filter(c => c.type === "cert");
