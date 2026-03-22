import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChannelList } from '@/components/molecules/ChannelList'
import { ContentList } from '@/components/organisms/ContentList'
import { channelsApi, contentApi } from '@/lib/api/endpoints'

export function HomePage() {
  const [selectedChannelId, setSelectedChannelId] = useState<string>('javascript')

  // Fetch channels
  const { data: channelsData, isLoading: channelsLoading } = useQuery({
    queryKey: ['channels'],
    queryFn: () => channelsApi.getAll(),
  })

  // Fetch content for selected channel
  const {
    data: contentData,
    isLoading: contentLoading,
    error: contentError,
  } = useQuery({
    queryKey: ['content', selectedChannelId],
    queryFn: () => contentApi.getByChannel(selectedChannelId),
    enabled: !!selectedChannelId,
  })

  const channels = channelsData?.data || []
  const content = contentData?.data || []

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">DevPrep</h1>
        <p className="mt-2 text-muted-foreground">
          Technical interview preparation with AI-generated content
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-4">
        <div className="md:col-span-1">
          {channelsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-8 animate-pulse rounded bg-muted"></div>
              ))}
            </div>
          ) : (
            <ChannelList
              channels={channels}
              selectedChannelId={selectedChannelId}
              onChannelSelect={setSelectedChannelId}
            />
          )}
        </div>

        <div className="md:col-span-3">
          <ContentList
            content={content}
            isLoading={contentLoading}
            error={contentError as Error | undefined}
          />
        </div>
      </div>
    </div>
  )
}
