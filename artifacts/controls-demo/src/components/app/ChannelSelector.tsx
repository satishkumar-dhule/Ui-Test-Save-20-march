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

/**
 * Channel navigation bar for selecting between channels
 */
export function ChannelSelector({
  channelId,
  channelTypeFilter,
  selectedTechChannels,
  selectedCertChannels,
  theme,
  onChannelSwitch,
  onChannelTypeFilterChange,
  onEditChannels,
}: ChannelSelectorProps) {
  const hasBothTypes =
    selectedTechChannels.length > 0 && selectedCertChannels.length > 0;

  return (
    <div
      className="flex-shrink-0 flex items-center border-b border-border px-4 overflow-x-auto gap-1"
      style={{
        height: 44,
        background: theme === "dark" ? "#010409" : "#f6f8fa",
      }}
      data-testid="channel-bar"
    >
      {/* Channel type filter (only show if both types have channels) */}
      {hasBothTypes && (
        <div className="flex items-center shrink-0 border border-border rounded-md overflow-hidden mr-1">
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

      {/* Empty state messages */}
      {channelTypeFilter === "tech" &&
        selectedTechChannels.length === 0 &&
        selectedCertChannels.length > 0 && (
          <EmptyStateMessage type="tech" onAddChannels={onEditChannels} />
        )}
      {channelTypeFilter === "cert" &&
        selectedCertChannels.length === 0 &&
        selectedTechChannels.length > 0 && (
          <EmptyStateMessage type="cert" onAddChannels={onEditChannels} />
        )}

      {/* Tech channels */}
      {channelTypeFilter === "tech" &&
        selectedTechChannels.map((c) => (
          <ChannelTab
            key={c.id}
            channel={c}
            isActive={channelId === c.id}
            onClick={() => onChannelSwitch(c.id)}
          />
        ))}

      {/* Cert channels */}
      {channelTypeFilter === "cert" &&
        selectedCertChannels.map((c) => (
          <CertChannelTab
            key={c.id}
            channel={c}
            isActive={channelId === c.id}
            onClick={() => onChannelSwitch(c.id)}
          />
        ))}

      {/* Edit channels button */}
      <button
        data-testid="edit-tracks-btn"
        onClick={onEditChannels}
        className="ml-2 shrink-0 text-[11px] font-semibold text-primary px-2 py-0.5 rounded-full border border-dashed border-border hover:bg-accent transition-colors"
      >
        + Edit
      </button>
    </div>
  );
}

/**
 * Filter button for tech/cert toggle
 */
function FilterButton({
  active,
  disabled,
  onClick,
  label,
}: {
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-2 py-1 text-[11px] font-semibold transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {label}
    </button>
  );
}

/**
 * Empty state message when no channels of a type are selected
 */
function EmptyStateMessage({
  type,
  onAddChannels,
}: {
  type: "tech" | "cert";
  onAddChannels: () => void;
}) {
  return (
    <span className="text-xs text-muted-foreground shrink-0">
      No {type} channels.{" "}
      <button
        onClick={onAddChannels}
        className="text-primary underline hover:no-underline"
      >
        Add channels
      </button>
    </span>
  );
}

/**
 * Channel tab button for tech channels
 */
function ChannelTab({
  channel: c,
  isActive,
  onClick,
}: {
  channel: Channel;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      key={c.id}
      data-testid={`channel-tab-${c.id}`}
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 h-11 text-sm font-medium shrink-0 transition-all"
      style={{
        borderBottom: `2px solid ${isActive ? c.color : "transparent"}`,
        fontWeight: isActive ? 600 : 400,
      }}
    >
      <span
        className={isActive ? "text-foreground" : "text-muted-foreground"}
      >
        {c.emoji}
      </span>
      <span
        className={isActive ? "text-foreground" : "text-muted-foreground"}
      >
        {c.shortName}
      </span>
    </button>
  );
}

/**
 * Channel tab button for cert channels (includes cert badge)
 */
function CertChannelTab({
  channel: c,
  isActive,
  onClick,
}: {
  channel: Channel;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      key={c.id}
      data-testid={`channel-tab-${c.id}`}
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 h-11 text-sm shrink-0 transition-all"
      style={{
        borderBottom: `2px solid ${isActive ? c.color : "transparent"}`,
        fontWeight: isActive ? 600 : 400,
      }}
    >
      <span
        className={isActive ? "text-foreground" : "text-muted-foreground"}
      >
        {c.emoji}
      </span>
      <span
        className={isActive ? "text-foreground" : "text-muted-foreground"}
      >
        {c.shortName}
      </span>
      {c.certCode && (
        <span
          className="text-[9px] font-bold px-1 py-0.5 rounded-full"
          style={{
            color: c.color,
            background: c.color + "25",
            border: `1px solid ${c.color}44`,
          }}
        >
          {c.certCode}
        </span>
      )}
    </button>
  );
}
