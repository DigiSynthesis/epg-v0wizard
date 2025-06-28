import { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { ChannelManager } from './components/ChannelManager';
import { ExportModal } from './components/ExportModal';
import { ThemeProvider } from './components/ThemeProvider';
import { ThemeToggle } from './components/ThemeToggle';
import { Button } from './components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Download, Upload, Tv } from 'lucide-react';

export interface Channel {
  id: string;
  name: string;
  url: string;
  group: string;
  logo?: string;
  epg?: string;
  tvgId?: string;
  originalLine?: string;
}

export interface PlaylistData {
  channels: Channel[];
  groups: string[];
}

function AppContent() {
  const [playlistData, setPlaylistData] = useState<PlaylistData | null>(null);
  const [modifiedChannelIds, setModifiedChannelIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('upload');
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const handlePlaylistParsed = (data: PlaylistData) => {
    setPlaylistData(data);
    setModifiedChannelIds(new Set()); // Reset modified channels when new playlist is loaded
    setActiveTab('manage');
  };

  const handleChannelUpdate = (channelId: string, epgUrl: string) => {
    if (!playlistData) return;
    
    const updatedChannels = playlistData.channels.map(channel =>
      channel.id === channelId ? { ...channel, epg: epgUrl } : channel
    );
    
    setPlaylistData({
      ...playlistData,
      channels: updatedChannels
    });

    // Track that this channel has been modified
    setModifiedChannelIds(prev => new Set(prev).add(channelId));
  };

  const handleBulkChannelUpdate = (updates: Array<{ channelId: string; epgUrl: string }>) => {
    if (!playlistData) return;

    const updateMap = new Map(updates.map(update => [update.channelId, update.epgUrl]));
    
    const updatedChannels = playlistData.channels.map(channel =>
      updateMap.has(channel.id) 
        ? { ...channel, epg: updateMap.get(channel.id)! }
        : channel
    );
    
    setPlaylistData({
      ...playlistData,
      channels: updatedChannels
    });

    // Track all updated channels as modified
    const updatedChannelIds = updates.map(update => update.channelId);
    setModifiedChannelIds(prev => {
      const newSet = new Set(prev);
      updatedChannelIds.forEach(id => newSet.add(id));
      return newSet;
    });
  };

  const handleExportClick = () => {
    setExportModalOpen(true);
  };

  // Get the modified channels for export
  const getModifiedChannels = () => {
    if (!playlistData) return [];
    return playlistData.channels.filter(channel => modifiedChannelIds.has(channel.id));
  };

  const modifiedChannels = getModifiedChannels();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Tv className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold">IPTV Playlist Manager</h1>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              {playlistData && (
                <Button 
                  onClick={handleExportClick} 
                  className="flex items-center gap-2 text-base px-6 py-3"
                  size="lg"
                  disabled={modifiedChannels.length === 0}
                >
                  <Download className="w-5 h-5" />
                  Export M3U ({modifiedChannels.length})
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="flex items-center gap-3 text-lg">
              <Upload className="w-6 h-6" />
              Import Playlist
            </TabsTrigger>
            <TabsTrigger value="manage" disabled={!playlistData} className="flex items-center gap-3 text-lg">
              <Tv className="w-6 h-6" />
              Manage Channels ({playlistData?.channels.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-6">
            <FileUpload onPlaylistParsed={handlePlaylistParsed} />
          </TabsContent>

          <TabsContent value="manage" className="mt-6">
            {playlistData && (
              <ChannelManager 
                playlistData={playlistData}
                onChannelUpdate={handleChannelUpdate}
                onBulkChannelUpdate={handleBulkChannelUpdate}
              />
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Export Modal */}
      {playlistData && (
        <ExportModal
          isOpen={exportModalOpen}
          onClose={() => setExportModalOpen(false)}
          playlistData={playlistData}
          modifiedChannels={modifiedChannels}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="iptv-playlist-theme">
      <AppContent />
    </ThemeProvider>
  );
}