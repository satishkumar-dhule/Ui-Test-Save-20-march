import { Button } from '@/components/atoms/Button'
import { cn } from '@/lib/utils/cn'
import type { Channel } from '@/lib/api/endpoints'

interface ChannelListProps {
  channels: Channel[]
  selectedChannelId?: string
  onChannelSelect: (channelId: string) => void
  className?: string
}

export function ChannelList({
  channels,
  selectedChannelId,
  onChannelSelect,
  className,
}: ChannelListProps) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Channels
      </h2>
      <div className="flex flex-col gap-1.5">
        {channels.map(channel => (
          <Button
            key={channel.id}
            variant={selectedChannelId === channel.id ? 'default' : 'ghost'}
            size="sm"
            className="justify-start text-left"
            onClick={() => onChannelSelect(channel.id)}
          >
            {channel.name}
          </Button>
        ))}
      </div>
    </div>
  )
}
