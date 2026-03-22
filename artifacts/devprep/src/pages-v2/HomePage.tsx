import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
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
    <DashboardLayout
      title="DevPrep Dashboard"
      description="Technical interview preparation with AI-generated content"
      sidebar={
        channelsLoading ? (
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
        )
      }
      actions={
        <div className="flex items-center gap-2">
          <a
            href="/onboarding"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Get Started
          </a>
        </div>
      }
    >
      <ContentList
        content={content}
        isLoading={contentLoading}
        error={contentError as Error | undefined}
      />
    </DashboardLayout>
  )
}