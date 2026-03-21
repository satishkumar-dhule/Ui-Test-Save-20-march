import type { Channel } from "@/data/channels";

interface ChannelSelectorProps {
  channelId: string;
  channelTypeFilter: "tech" | "cert";
  selectedTechChannels: Channel[];
  selectedCertChannels: Channel[];
  theme: "dark" | "light";
  onChannelSwitch: (id: string) => void;
  onChannelTypeFilterChange: (filter: "tech" | "cert") => void;
  onEditChannels: () => void;
}

export function ChannelSelector({
  channelId,
  channelTypeFilter,
  selectedTechChannels,
  selectedCertChannels,
  onChannelSwitch,
  onChannelTypeFilterChange,
  onEditChannels,
}: ChannelSelectorProps) {
  const hasBothTypes =
    selectedTechChannels.length > 0 && selectedCertChannels.length > 0;

  return (
    <div
      className="flex-shrink-0 flex items-center border-b border-border/50 px-4 overflow-x-auto gap-1 bg-background"
      style={{ height: 40 }}
      data-testid="channel-bar"
    >
      {hasBothTypes && (
        <div className="flex items-center shrink-0 border border-border/40 rounded-md overflow-hidden mr-2">
          <FilterButton
            active={channelTypeFilter === "tech"}
            disabled={selectedTechChannels.length === 0}
            onClick={() => onChannelTypeFilterChange("tech")}
            label="Tech"
          />
          <FilterButton
            active={channelTypeFilter === "cert"}
            disabled={selectedCertChannels.length === 0}
            onClick={() => onChannelTypeFilterChange("cert")}
            label="Cert"
          />
        </div>
      )}

      {channelTypeFilter === "tech" && selectedTechChannels.length === 0 && selectedCertChannels.length > 0 && (
        <EmptyMsg type="tech" onAdd={onEditChannels} />
      )}
      {channelTypeFilter === "cert" && selectedCertChannels.length === 0 && selectedTechChannels.length > 0 && (
        <EmptyMsg type="cert" onAdd={onEditChannels} />
      )}

      {channelTypeFilter === "tech" &&
        selectedTechChannels.map((c) => (
          <ChannelTab key={c.id} channel={c} isActive={channelId === c.id} onClick={() => onChannelSwitch(c.id)} />
        ))}

      {channelTypeFilter === "cert" &&
        selectedCertChannels.map((c) => (
          <CertChannelTab key={c.id} channel={c} isActive={channelId === c.id} onClick={() => onChannelSwitch(c.id)} />
        ))}

      <button
        data-testid="edit-tracks-btn"
        onClick={onEditChannels}
        className="ml-2 shrink-0 text-[9px] font-bold uppercase tracking-widest text-muted-foreground px-2 py-0.5 rounded border border-dashed border-border/40 hover:text-primary hover:border-primary/30 transition-colors"
      >
        + Edit
      </button>
    </div>
  );
}

function FilterButton({ active, disabled, onClick, label }: {
  active: boolean; disabled: boolean; onClick: () => void; label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest transition-colors ${
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-foreground"
      } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
    >
      {label}
    </button>
  );
}

function EmptyMsg({ type, onAdd }: { type: "tech" | "cert"; onAdd: () => void }) {
  return (
    <span className="text-[10px] text-muted-foreground shrink-0">
      No {type} channels.{" "}
      <button onClick={onAdd} className="text-primary hover:underline">
        Add
      </button>
    </span>
  );
}

function ChannelTab({ channel: c, isActive, onClick }: { channel: Channel; isActive: boolean; onClick: () => void }) {
  return (
    <button
      data-testid={`channel-tab-${c.id}`}
      onClick={onClick}
      className="relative flex items-center gap-1.5 px-2.5 h-10 shrink-0 transition-colors duration-150"
      style={{ color: isActive ? c.color : "hsl(var(--muted-foreground))" }}
    >
      <span className="text-sm">{c.emoji}</span>
      <span className="text-[10px] font-bold uppercase tracking-widest">
        {c.shortName}
      </span>
      <span
        className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full transition-all"
        style={{ background: isActive ? c.color + "80" : "transparent" }}
      />
    </button>
  );
}

function CertChannelTab({ channel: c, isActive, onClick }: { channel: Channel; isActive: boolean; onClick: () => void }) {
  return (
    <button
      data-testid={`channel-tab-${c.id}`}
      onClick={onClick}
      className="relative flex items-center gap-1.5 px-2.5 h-10 shrink-0 transition-colors duration-150"
      style={{ color: isActive ? c.color : "hsl(var(--muted-foreground))" }}
    >
      <span className="text-sm">{c.emoji}</span>
      <span className="text-[10px] font-bold uppercase tracking-widest">
        {c.shortName}
      </span>
      {c.certCode && (
        <span
          className="text-[8px] font-bold px-1 py-0.5 rounded"
          style={{
            color: c.color,
            background: c.color + "20",
            border: `1px solid ${c.color}30`,
          }}
        >
          {c.certCode}
        </span>
      )}
      <span
        className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full transition-all"
        style={{ background: isActive ? c.color + "80" : "transparent" }}
      />
    </button>
  );
}
