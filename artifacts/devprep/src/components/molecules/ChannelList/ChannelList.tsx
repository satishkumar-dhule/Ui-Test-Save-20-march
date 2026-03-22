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
    <div className={cn('flex flex-col gap-2', className)}>
      <h2 className="text-lg font-semibold">Channels</h2>
      <div className="flex flex-wrap gap-2">
        {channels.map(channel => (
          <Button
            key={channel.id}
            variant={selectedChannelId === channel.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => onChannelSelect(channel.id)}
          >
            {channel.name}
          </Button>
        ))}
      </div>
    </div>
  )
}
