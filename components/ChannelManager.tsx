import { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Search, Tv, Globe, ExternalLink, Check, ChevronDown, X, Filter, Info, Zap } from 'lucide-react';
import { EPGSearch } from './EPGSearch';
import { LazyChannelList } from './LazyChannelList';
import { BulkEPGModal } from './BulkEPGModal';
import type { PlaylistData, Channel } from '../App';

interface ChannelManagerProps {
  playlistData: PlaylistData;
  onChannelUpdate: (channelId: string, epgUrl: string) => void;
  onBulkChannelUpdate: (updates: Array<{ channelId: string; epgUrl: string }>) => void;
}

const LAZY_LOADING_THRESHOLD = 150;

export function ChannelManager({ playlistData, onChannelUpdate, onBulkChannelUpdate }: ChannelManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [groupFilterOpen, setGroupFilterOpen] = useState(false);
  const [groupSearchValue, setGroupSearchValue] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [bulkEPGModalOpen, setBulkEPGModalOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [epgInfoDismissed, setEpgInfoDismissed] = useState(() => {
    // Check localStorage for dismissed state
    return localStorage.getItem('epg-info-dismissed') === 'true';
  });
  const [performanceNoticesDismissed, setPerformanceNoticesDismissed] = useState(() => {
    // Check localStorage for dismissed state
    return localStorage.getItem('performance-notices-dismissed') === 'true';
  });
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Keep track of playlist structure to detect actual playlist changes vs channel updates
  const [playlistStructureId, setPlaylistStructureId] = useState<string>('');

  // Only reset group selection when playlist structure changes (new playlist loaded)
  useEffect(() => {
    // Create a unique identifier for the playlist structure based on channel count and groups
    const newStructureId = `${playlistData.channels.length}-${playlistData.groups.length}-${playlistData.groups.join(',')}`;
    
    // Only reset if this is a completely different playlist structure
    if (playlistStructureId && newStructureId !== playlistStructureId) {
      setSelectedGroup('');
      setGroupSearchValue('');
    }
    
    setPlaylistStructureId(newStructureId);
  }, [playlistData.channels.length, playlistData.groups.length, playlistData.groups.join(','), playlistStructureId]);

  // Helper function to check if channel has EPG data
  const hasEPG = (channel: Channel): boolean => {
    return !!(channel.epg || channel.tvgId);
  };

  const filteredChannels = useMemo(() => {
    // If no group selected and no search term, return empty array to show message
    if (!selectedGroup && !searchTerm.trim()) {
      return [];
    }

    let channels = playlistData.channels;

    // Filter by group
    if (selectedGroup && selectedGroup !== 'all') {
      channels = channels.filter(channel => channel.group === selectedGroup);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      channels = channels.filter(channel =>
        channel.name.toLowerCase().includes(term) ||
        channel.group.toLowerCase().includes(term)
      );
    }

    return channels;
  }, [playlistData.channels, selectedGroup, searchTerm]);

  const channelsByGroup = useMemo(() => {
    const grouped: Record<string, Channel[]> = {};
    filteredChannels.forEach(channel => {
      if (!grouped[channel.group]) {
        grouped[channel.group] = [];
      }
      grouped[channel.group].push(channel);
    });
    return grouped;
  }, [filteredChannels]);

  const channelsWithoutEPG = useMemo(() => {
    return playlistData.channels.filter(channel => !hasEPG(channel));
  }, [playlistData.channels]);

  const channelsWithEPG = useMemo(() => {
    return playlistData.channels.filter(channel => hasEPG(channel));
  }, [playlistData.channels]);

  // Get filtered channels without EPG (for the selected group/search)
  const filteredChannelsWithoutEPG = useMemo(() => {
    return filteredChannels.filter(channel => !hasEPG(channel));
  }, [filteredChannels]);

  const filteredGroups = useMemo(() => {
    if (!groupSearchValue.trim()) {
      return playlistData.groups;
    }
    const searchLower = groupSearchValue.toLowerCase();
    return playlistData.groups.filter(group => 
      group.toLowerCase().includes(searchLower)
    );
  }, [playlistData.groups, groupSearchValue]);

  // All options including "All Groups"
  const allOptions = useMemo(() => {
    const options = [{ value: 'all', label: 'All Groups', count: playlistData.channels.length }];
    filteredGroups.forEach(group => {
      options.push({
        value: group,
        label: group,
        count: playlistData.channels.filter(c => c.group === group).length
      });
    });
    return options;
  }, [filteredGroups, playlistData.channels]);

  const handleEPGAssignment = (channelId: string, epgUrl: string) => {
    onChannelUpdate(channelId, epgUrl);
    // Close the EPG search modal but maintain the selected group
    setSelectedChannel(null);
    // The selectedGroup state remains unchanged, preserving the current view
  };

  const handleBulkEPGAssignment = (updates: Array<{ channelId: string; epgUrl: string }>) => {
    onBulkChannelUpdate(updates);
  };

  const handleGroupSelect = (group: string) => {
    setSelectedGroup(group);
    setGroupSearchValue(group === 'all' ? '' : group);
    setGroupFilterOpen(false);
    setActiveIndex(-1);
  };

  const clearGroupFilter = () => {
    setSelectedGroup('');
    setGroupSearchValue('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGroupSearchValue(e.target.value);
    setGroupFilterOpen(true);
    setActiveIndex(-1);
  };

  const handleInputFocus = () => {
    setGroupFilterOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!groupFilterOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => (prev + 1) % allOptions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => prev <= 0 ? allOptions.length - 1 : prev - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && allOptions[activeIndex]) {
          handleGroupSelect(allOptions[activeIndex].value);
        }
        break;
      case 'Escape':
        setGroupFilterOpen(false);
        setActiveIndex(-1);
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setGroupFilterOpen(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDismissEpgInfo = () => {
    setEpgInfoDismissed(true);
    localStorage.setItem('epg-info-dismissed', 'true');
  };

  const handleDismissPerformanceNotices = () => {
    setPerformanceNoticesDismissed(true);
    localStorage.setItem('performance-notices-dismissed', 'true');
  };

  const getEPGBadgeInfo = (channel: Channel) => {
    if (channel.epg && channel.tvgId) {
      return { text: 'EPG + ID', variant: 'default' as const, className: 'bg-blue-500' };
    } else if (channel.epg) {
      return { text: 'EPG URL', variant: 'default' as const, className: 'bg-green-500' };
    } else if (channel.tvgId) {
      return { text: 'EPG ID', variant: 'default' as const, className: 'bg-purple-500' };
    } else {
      return { text: 'No EPG', variant: 'outline' as const, className: '' };
    }
  };

  // Determine if we should use lazy loading
  const shouldUseLazyLoading = filteredChannels.length > LAZY_LOADING_THRESHOLD;

  return (
    <div className="space-y-6 bg-[rgba(0,0,0,0)] p-6">
      {/* Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Tv className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Channels</p>
                <p className="text-2xl font-bold">{playlistData.channels.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="w-5 h-5 rounded-full p-0 flex items-center justify-center">
                G
              </Badge>
              <div>
                <p className="text-sm text-muted-foreground">Groups</p>
                <p className="text-2xl font-bold">{playlistData.groups.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Globe className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">With EPG</p>
                <p className="text-2xl font-bold">{channelsWithEPG.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ExternalLink className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Need EPG</p>
                <p className="text-2xl font-bold">{channelsWithoutEPG.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* EPG Info Card */}
      {!epgInfoDismissed && (
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
              <div className="space-y-2 flex-1">
                <h3 className="font-medium text-blue-900 dark:text-blue-100">EPG Recognition</h3>
                <p className="text-sm text-blue-700 dark:text-blue-200">
                  Channels are automatically recognized as having EPG data if they contain either:
                </p>
                <div className="flex flex-wrap gap-2 text-sm">
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                    tvg-url="..." (EPG URL)
                  </Badge>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">
                    tvg-id="..." (EPG ID)
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-400 shrink-0"
                onClick={handleDismissEpgInfo}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter Channels
          </CardTitle>
          <CardDescription>
            Search and filter channels by name or group
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="group-filter">Filter by Group</Label>
              <div className="relative mt-1" ref={dropdownRef}>
                <div className="relative">
                  <Input
                    ref={inputRef}
                    id="group-filter"
                    placeholder="Type to search groups..."
                    value={groupSearchValue}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    onKeyDown={handleKeyDown}
                    className="pr-20"
                    autoComplete="off"
                  />
                  <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                    {selectedGroup && selectedGroup !== 'all' && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-muted"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearGroupFilter();
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${groupFilterOpen ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* Dropdown */}
                {groupFilterOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-hidden">
                    <div className="max-h-60 overflow-y-auto">
                      <div className="p-1">
                        {allOptions.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-muted-foreground">
                            No groups found
                          </div>
                        ) : (
                          allOptions.map((option, index) => (
                            <div
                              key={option.value}
                              className={`flex items-center justify-between px-3 py-2 text-sm cursor-pointer rounded-sm transition-colors ${
                                index === activeIndex ? 'bg-accent' : 'hover:bg-accent'
                              }`}
                              onClick={() => handleGroupSelect(option.value)}
                            >
                              <div className="flex items-center gap-2">
                                <Check 
                                  className={`h-4 w-4 ${selectedGroup === option.value ? 'opacity-100' : 'opacity-0'}`} 
                                />
                                <span>{option.label}</span>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {option.count}
                              </Badge>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {selectedGroup && selectedGroup !== 'all' && (
                <div className="mt-2">
                  <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                    {selectedGroup}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-muted ml-1"
                      onClick={clearGroupFilter}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                </div>
              )}
            </div>
            
            <div>
              <Label htmlFor="search">Search Channels</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by channel name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Notice */}
      {shouldUseLazyLoading && (selectedGroup || searchTerm.trim()) && !performanceNoticesDismissed && (
        <Card className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
              <div className="space-y-1 flex-1">
                <h3 className="font-medium text-yellow-900 dark:text-yellow-100">
                  Performance Mode Active
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-200">
                  Large channel list detected ({filteredChannels.length} channels). 
                  Using lazy loading for optimal performance. Channels load as you scroll.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-yellow-200 dark:hover:bg-yellow-800 text-yellow-600 dark:text-yellow-400 shrink-0"
                onClick={handleDismissPerformanceNotices}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Channel List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {!selectedGroup && !searchTerm.trim() ? 'Select a Group or Search' 
                 : selectedGroup === 'all' ? `All Channels (${filteredChannels.length})` 
                 : selectedGroup ? `${selectedGroup} Channels (${filteredChannels.length})`
                 : `Search Results (${filteredChannels.length})`}
              </CardTitle>
              <CardDescription>
                {!selectedGroup && !searchTerm.trim() 
                  ? 'Select a group from the dropdown or search for channels to get started.'
                  : selectedGroup === 'all' 
                    ? 'Showing all channels across all groups. Use the filter above to narrow down to a specific group.'
                    : selectedGroup
                      ? `Showing channels from the "${selectedGroup}" group. Click on a channel to assign EPG data.`
                      : 'Showing channels matching your search. Click on a channel to assign EPG data.'
                }
              </CardDescription>
            </div>
            
            {/* Auto-Assign EPG Button - only show when group is selected and there are channels without EPG in the filtered view */}
            {(selectedGroup || searchTerm.trim()) && filteredChannelsWithoutEPG.length > 0 && (
              <Button 
                onClick={() => setBulkEPGModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shrink-0"
                size="sm"
              >
                <Zap className="w-4 h-4" />
                Auto-Assign EPG ({filteredChannelsWithoutEPG.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!selectedGroup && !searchTerm.trim() ? (
            <div className="text-center py-12">
              <Filter className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Select a group or search for a channel</h3>
              <p className="text-muted-foreground mb-4">
                Use the fields above to filter channels by group or search for specific channels.
                This prevents performance issues when working with large playlists.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    if (playlistData.groups.length > 0) {
                      setSelectedGroup(playlistData.groups[0]);
                      setGroupSearchValue(playlistData.groups[0]);
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <Tv className="w-4 h-4" />
                  Select First Group
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedGroup('all');
                    setGroupSearchValue('');
                  }}
                  className="flex items-center gap-2"
                >
                  <Globe className="w-4 h-4" />
                  Show All Groups
                </Button>
              </div>
            </div>
          ) : filteredChannels.length === 0 ? (
            <div className="text-center py-12">
              <Tv className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No channels found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm.trim() 
                  ? `No channels match your search "${searchTerm}"`
                  : selectedGroup && selectedGroup !== 'all'
                    ? `No channels found in the "${selectedGroup}" group`
                    : 'No channels found'
                }
              </p>
              {searchTerm.trim() && (
                <Button 
                  variant="outline" 
                  onClick={() => setSearchTerm('')}
                  className="mr-2"
                >
                  Clear search
                </Button>
              )}
              <Button variant="outline" onClick={clearGroupFilter}>
                Clear filters
              </Button>
            </div>
          ) : shouldUseLazyLoading ? (
            <LazyChannelList
              channelsByGroup={channelsByGroup}
              onChannelSelect={setSelectedChannel}
              getEPGBadgeInfo={getEPGBadgeInfo}
              totalChannels={filteredChannels.length}
            />
          ) : (
            <ScrollArea className="h-[600px] w-full">
              <div className="space-y-4">
                {Object.entries(channelsByGroup).map(([group, channels]) => (
                  <div key={group}>
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="font-semibold">{group}</h3>
                      <Badge variant="secondary">{channels.length}</Badge>
                    </div>
                    
                    <div className="grid gap-2 mb-6">
                      {channels.map(channel => {
                        const epgBadge = getEPGBadgeInfo(channel);
                        return (
                          <div
                            key={channel.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                            onClick={() => setSelectedChannel(channel)}
                          >
                            <div className="flex items-center gap-3">
                              {channel.logo && (
                                <img
                                  src={channel.logo}
                                  alt={channel.name}
                                  className="w-8 h-8 rounded object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
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
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* EPG Search Dialog */}
      {selectedChannel && (
        <EPGSearch
          channel={selectedChannel}
          onClose={() => setSelectedChannel(null)}
          onAssignEPG={handleEPGAssignment}
        />
      )}

      {/* Bulk EPG Modal - now works on filtered channels only */}
      <BulkEPGModal
        isOpen={bulkEPGModalOpen}
        onClose={() => setBulkEPGModalOpen(false)}
        channels={filteredChannelsWithoutEPG}
        onBulkUpdate={handleBulkEPGAssignment}
      />
    </div>
  );
}