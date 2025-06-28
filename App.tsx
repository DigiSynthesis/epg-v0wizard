import { useState, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { ChannelManager } from './components/ChannelManager';
import { ExportModal } from './components/ExportModal';
import { Auth } from './components/Auth';
import { ThemeProvider } from './components/ThemeProvider';
import { ThemeToggle } from './components/ThemeToggle';
import { Button } from './components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Alert, AlertDescription } from './components/ui/alert';
import { Download, Upload, Tv, LogOut, User, Cloud, Loader2 } from 'lucide-react';
import { supabase } from './lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { Toaster } from './components/ui/sonner';

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

// Development mode flag - set to true to bypass authentication
const DEVELOPMENT_MODE = true;

function AppContent() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [playlistData, setPlaylistData] = useState<PlaylistData | null>(null);
  const [modifiedChannelIds, setModifiedChannelIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('upload');
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [loadingUserData, setLoadingUserData] = useState(false);

  useEffect(() => {
    if (DEVELOPMENT_MODE) {
      // In development mode, create a mock user and skip authentication
      const mockUser = {
        id: 'dev-user-123',
        email: 'dev@example.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        aud: 'authenticated',
        role: 'authenticated',
        app_metadata: {},
        user_metadata: {}
      } as SupabaseUser;
      
      setUser(mockUser);
      setLoading(false);
      return;
    }

    // Production authentication logic
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        loadUserEPGData(session.user.id);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      
      if (event === 'SIGNED_IN' && session?.user) {
        loadUserEPGData(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setPlaylistData(null);
        setModifiedChannelIds(new Set());
        setActiveTab('upload');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserEPGData = async (userId: string) => {
    if (DEVELOPMENT_MODE) {
      // Skip loading user data in development mode
      return;
    }

    setLoadingUserData(true);
    try {
      // Fetch user's EPG file from database
      const { data: epgFile, error } = await supabase
        .from('epg_files')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching EPG file:', error);
        return;
      }

      if (epgFile) {
        // Fetch the M3U content from the public URL
        try {
          const response = await fetch(epgFile.public_url);
          if (response.ok) {
            const m3uContent = await response.text();
            const parsedData = parseM3U(m3uContent);
            setPlaylistData(parsedData);
            setActiveTab('manage');
            toast.success('Your saved EPG data has been loaded!');
          }
        } catch (fetchError) {
          console.error('Error fetching M3U content:', fetchError);
          toast.error('Failed to load your saved EPG data');
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoadingUserData(false);
    }
  };

  // Simple M3U parser (reused from FileUpload component)
  const parseM3U = (content: string): PlaylistData => {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    const channels: Channel[] = [];
    const groupSet = new Set<string>();
    
    let currentChannel: Partial<Channel> = {};
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.startsWith('#EXTINF:')) {
        const match = line.match(/#EXTINF:(-?\d+)(?:\s+(.*))?,(.*)$/);
        if (match) {
          const [, , attributes, name] = match;
          
          currentChannel = {
            name: name?.trim() || 'Unknown Channel',
            originalLine: line
          };
          
          if (attributes) {
            const tvgIdMatch = attributes.match(/tvg-id="([^"]*)"/);
            if (tvgIdMatch) {
              currentChannel.tvgId = tvgIdMatch[1];
            }
            
            const tvgLogoMatch = attributes.match(/tvg-logo="([^"]*)"/);
            if (tvgLogoMatch) {
              currentChannel.logo = tvgLogoMatch[1];
            }
            
            const groupMatch = attributes.match(/group-title="([^"]*)"/);
            if (groupMatch) {
              currentChannel.group = groupMatch[1];
            }
            
            const epgMatch = attributes.match(/tvg-url="([^"]*)"/);
            if (epgMatch) {
              currentChannel.epg = epgMatch[1];
            }
          }
          
          if (!currentChannel.group) {
            currentChannel.group = 'Uncategorized';
          }
          
          groupSet.add(currentChannel.group);
        }
      } else if (line.startsWith('http')) {
        if (currentChannel.name) {
          const channel: Channel = {
            id: Math.random().toString(36).substr(2, 9),
            name: currentChannel.name,
            url: line,
            group: currentChannel.group || 'Uncategorized',
            logo: currentChannel.logo,
            epg: currentChannel.epg,
            tvgId: currentChannel.tvgId,
            originalLine: currentChannel.originalLine
          };
          
          channels.push(channel);
          groupSet.add(channel.group);
        }
        currentChannel = {};
      }
    }
    
    return {
      channels,
      groups: Array.from(groupSet).sort()
    };
  };

  const handlePlaylistParsed = (data: PlaylistData) => {
    setPlaylistData(data);
    setModifiedChannelIds(new Set());
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

  const handleSignOut = async () => {
    if (DEVELOPMENT_MODE) {
      // In development mode, just clear the user state
      setUser(null);
      setPlaylistData(null);
      setModifiedChannelIds(new Set());
      setActiveTab('upload');
      toast.success('Signed out (development mode)');
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Error signing out');
    } else {
      toast.success('Signed out successfully');
    }
  };

  const getModifiedChannels = () => {
    if (!playlistData) return [];
    return playlistData.channels.filter(channel => modifiedChannelIds.has(channel.id));
  };

  const modifiedChannels = getModifiedChannels();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Tv className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">IPTV Playlist Manager</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Cloud className="w-4 h-4" />
                  <span>
                    {DEVELOPMENT_MODE ? 'Development Mode' : `Signed in as ${user.email}`}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Button variant="outline" onClick={handleSignOut} className="flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                {DEVELOPMENT_MODE ? 'Exit Dev Mode' : 'Sign Out'}
              </Button>
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
        {loadingUserData && (
          <Alert className="mb-6">
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Loading your saved EPG data...
            </AlertDescription>
          </Alert>
        )}

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

      {playlistData && (
        <ExportModal
          isOpen={exportModalOpen}
          onClose={() => setExportModalOpen(false)}
          playlistData={playlistData}
          modifiedChannels={modifiedChannels}
          user={user}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="iptv-playlist-theme">
      <AppContent />
      <Toaster />
    </ThemeProvider>
  );
}