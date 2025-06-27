import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Loader2, ChevronDown } from 'lucide-react';
import type { Channel } from '../App';

interface LazyImageProps {
  src: string;
  alt: string;
  className: string;
}

function LazyImage({ src, alt, className }: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className={className}>
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={`${className} transition-opacity duration-200 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setIsLoaded(true)}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      )}
    </div>
  );
}

interface LazyChannelListProps {
  channelsByGroup: Record<string, Channel[]>;
  onChannelSelect: (channel: Channel) => void;
  getEPGBadgeInfo: (channel: Channel) => {
    text: string;
    variant: 'default' | 'outline';
    className: string;
  };
  totalChannels: number;
}

const BATCH_SIZE = 50;

export function LazyChannelList({
  channelsByGroup,
  onChannelSelect,
  getEPGBadgeInfo,
  totalChannels
}: LazyChannelListProps) {
  const [loadedCount, setLoadedCount] = useState(BATCH_SIZE);
  const [isLoading, setIsLoading] = useState(false);
  
  // Flatten channels while preserving group structure for display
  const allChannels = Object.entries(channelsByGroup).flatMap(([group, channels]) =>
    channels.map(channel => ({ ...channel, displayGroup: group }))
  );

  const visibleChannels = allChannels.slice(0, loadedCount);
  const hasMore = loadedCount < totalChannels;

  const loadMore = useCallback(() => {
    setIsLoading(true);
    // Simulate loading delay for better UX
    setTimeout(() => {
      setLoadedCount(prev => Math.min(prev + BATCH_SIZE, totalChannels));
      setIsLoading(false);
    }, 300);
  }, [totalChannels]);

  // Group visible channels by their display group
  const visibleChannelsByGroup = visibleChannels.reduce((acc, channel) => {
    const group = channel.displayGroup;
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(channel);
    return acc;
  }, {} as Record<string, (Channel & { displayGroup: string })[]>);

  return (
    <ScrollArea className="h-[600px] w-full">
      <div className="space-y-4">
        {Object.entries(visibleChannelsByGroup).map(([group, channels]) => (
          <div key={group}>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-semibold">{group}</h3>
              <Badge variant="secondary">
                {channelsByGroup[group]?.length || 0}
                {loadedCount < totalChannels && ` (showing ${channels.length})`}
              </Badge>
            </div>
            
            <div className="grid gap-2 mb-6">
              {channels.map(channel => {
                const epgBadge = getEPGBadgeInfo(channel);
                return (
                  <div
                    key={channel.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => onChannelSelect(channel)}
                  >
                    <div className="flex items-center gap-3">
                      {channel.logo && (
                        <LazyImage
                          src={channel.logo}
                          alt={channel.name}
                          className="w-8 h-8 rounded object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium">{channel.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{channel.group}</span>
                          {channel.tvgId && (
                            <>
                              <span>•</span>
                              <span className="text-purple-600 dark:text-purple-400 font-mono text-xs">
                                ID: {channel.tvgId}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={epgBadge.variant}
                        className={epgBadge.className}
                      >
                        {epgBadge.text}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {Object.keys(visibleChannelsByGroup).length > 1 && (
              <Separator className="my-4" />
            )}
          </div>
        ))}

        {/* Load More Button */}
        {hasMore && (
          <div className="flex flex-col items-center py-6 space-y-3">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Showing {loadedCount} of {totalChannels} channels
              </p>
              <div className="w-full bg-muted rounded-full h-2 mt-2 max-w-xs">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(loadedCount / totalChannels) * 100}%` }}
                />
              </div>
            </div>
            <Button 
              onClick={loadMore} 
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Load More ({Math.min(BATCH_SIZE, totalChannels - loadedCount)})
                </>
              )}
            </Button>
          </div>
        )}

        {!hasMore && totalChannels > BATCH_SIZE && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              All {totalChannels} channels loaded
            </p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}