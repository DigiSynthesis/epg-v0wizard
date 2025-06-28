import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Search, Globe, Check, ExternalLink, Loader2, Hash } from 'lucide-react';
import type { Channel } from '../App';

interface EPGSource {
  id: string;
  name: string;
  url: string;
  description: string;
  coverage: string;
  reliability: 'high' | 'medium' | 'low';
}

interface EPGSearchProps {
  channel: Channel;
  onClose: () => void;
  onAssignEPG: (channelId: string, epgUrl: string) => void;
}

export function EPGSearch({ channel, onClose, onAssignEPG }: EPGSearchProps) {
  const [searchTerm, setSearchTerm] = useState(channel.name);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<EPGSource[]>([]);
  const [customEPGUrl, setCustomEPGUrl] = useState('');

  // Mock EPG sources for demonstration
  const mockEPGSources: EPGSource[] = [
    {
      id: '1',
      name: 'XMLTV.org',
      url: 'https://xmltv.org/epg/guide.xml',
      description: 'Comprehensive EPG data for international channels',
      coverage: 'Global',
      reliability: 'high'
    },
    {
      id: '2',
      name: 'EPG123',
      url: 'https://epg123.com/guide.xml',
      description: 'US and Canada EPG data',
      coverage: 'North America',
      reliability: 'high'
    },
    {
      id: '3',
      name: 'TV Guide',
      url: 'https://tvguide.example.com/epg.xml',
      description: 'Popular TV guide with extensive channel coverage',
      coverage: 'US, UK, Canada',
      reliability: 'medium'
    },
    {
      id: '4',
      name: 'OpenEPG',
      url: 'https://openepg.com/data.xml',
      description: 'Open source EPG data',
      coverage: 'Europe',
      reliability: 'medium'
    }
  ];

  const handleSearch = async () => {
    setSearching(true);
    setSearchResults([]);

    // Simulate API search delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock search results based on channel name/group
    const results = mockEPGSources.filter(source => {
      const channelLower = channel.name.toLowerCase();
      const groupLower = channel.group.toLowerCase();
      
      // Simple matching logic for demo
      if (groupLower.includes('news') && source.coverage.includes('Global')) return true;
      if (groupLower.includes('sports') && source.coverage.includes('US')) return true;
      if (groupLower.includes('uk') && source.coverage.includes('UK')) return true;
      if (groupLower.includes('canada') && source.coverage.includes('Canada')) return true;
      
      return Math.random() > 0.5; // Random results for demo
    });

    setSearchResults(results);
    setSearching(false);
  };

  const getReliabilityColor = (reliability: string) => {
    switch (reliability) {
      case 'high': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const handleAssignEPG = (epgUrl: string) => {
    onAssignEPG(channel.id, epgUrl);
    onClose();
  };

  const hasEPG = !!(channel.epg || channel.tvgId);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Find EPG for "{channel.name}"
          </DialogTitle>
          <DialogDescription>
            Search for Electronic Program Guide (EPG) data for this channel
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Channel Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Channel Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Channel Name</Label>
                  <p className="font-medium">{channel.name}</p>
                </div>
                <div>
                  <Label>Group</Label>
                  <p className="font-medium">{channel.group}</p>
                </div>
                {channel.logo && (
                  <div>
                    <Label>Logo</Label>
                    <img
                      src={channel.logo}
                      alt={channel.name}
                      className="w-16 h-16 rounded object-cover mt-1"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div>
                  <Label>Current EPG Status</Label>
                  <div className="mt-1 space-y-2">
                    {channel.epg && (
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="bg-green-500">
                          EPG URL
                        </Badge>
                        <span className="text-sm text-muted-foreground font-mono">
                          {channel.epg}
                        </span>
                      </div>
                    )}
                    {channel.tvgId && (
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="bg-purple-500">
                          <Hash className="w-3 h-3 mr-1" />
                          EPG ID
                        </Badge>
                        <span className="text-sm text-muted-foreground font-mono">
                          {channel.tvgId}
                        </span>
                      </div>
                    )}
                    {!hasEPG && (
                      <Badge variant="outline">
                        No EPG assigned
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="epg-search">Search EPG Sources</Label>
              <div className="flex gap-2 mt-1">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="epg-search"
                    placeholder="Enter channel name or keywords..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button onClick={handleSearch} disabled={searching || !searchTerm.trim()}>
                  {searching ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Found EPG Sources ({searchResults.length})</h3>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {searchResults.map(source => (
                      <Card key={source.id} className="cursor-pointer hover:bg-accent transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium">{source.name}</h4>
                                <Badge 
                                  variant="secondary" 
                                  className={`text-white ${getReliabilityColor(source.reliability)}`}
                                >
                                  {source.reliability} reliability
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {source.description}
                              </p>
                              <div className="flex items-center gap-4 text-sm">
                                <span><strong>Coverage:</strong> {source.coverage}</span>
                                <span className="flex items-center gap-1">
                                  <ExternalLink className="w-3 h-3" />
                                  {source.url}
                                </span>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleAssignEPG(source.url)}
                              className="ml-4"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Assign
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {searching && (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">Searching EPG sources...</p>
              </div>
            )}
          </div>

          {/* Manual EPG URL */}
          <div className="space-y-3">
            <Label htmlFor="custom-epg">Or Enter Custom EPG URL</Label>
            <div className="flex gap-2">
              <Input
                id="custom-epg"
                placeholder="https://example.com/epg.xml"
                value={customEPGUrl}
                onChange={(e) => setCustomEPGUrl(e.target.value)}
              />
              <Button
                onClick={() => handleAssignEPG(customEPGUrl)}
                disabled={!customEPGUrl.trim()}
                variant="outline"
              >
                <Check className="w-4 h-4 mr-1" />
                Assign
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}