import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { Upload, Link, Loader2, CheckCircle, AlertCircle, FileText, Info, Filter } from 'lucide-react';
import type { PlaylistData, Channel } from '../App';

interface FileUploadProps {
  onPlaylistParsed: (data: PlaylistData) => void;
}

export function FileUpload({ onPlaylistParsed }: FileUploadProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  // Function to check if a URL has a video file extension (indicates Movies/Shows)
  const hasVideoFileExtension = (url: string): boolean => {
    const videoExtensions = [
      '.mkv', '.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v', 
      '.3gp', '.ts', '.m2ts', '.mts', '.vob', '.f4v', '.asf', '.rm', 
      '.rmvb', '.divx', '.xvid', '.ogv', '.ogg'
    ];
    
    const lowerUrl = url.toLowerCase();
    return videoExtensions.some(ext => lowerUrl.endsWith(ext));
  };

  const parseM3U = (content: string): PlaylistData => {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    const channels: Channel[] = [];
    const groupSet = new Set<string>();
    
    let currentChannel: Partial<Channel> = {};
    let totalLinesProcessed = 0;
    let stoppedEarly = false;
    let stopReason = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      totalLinesProcessed++;
      
      if (line.startsWith('#EXTINF:')) {
        // Parse channel info
        const match = line.match(/#EXTINF:(-?\d+)(?:\s+(.*))?,(.*)$/);
        if (match) {
          const [, , attributes, name] = match;
          
          currentChannel = {
            name: name?.trim() || 'Unknown Channel',
            originalLine: line
          };
          
          // Parse attributes
          if (attributes) {
            // Extract tvg-id
            const tvgIdMatch = attributes.match(/tvg-id="([^"]*)"/);
            if (tvgIdMatch) {
              currentChannel.tvgId = tvgIdMatch[1];
            }
            
            // Extract tvg-name
            const tvgNameMatch = attributes.match(/tvg-name="([^"]*)"/);
            if (tvgNameMatch && !currentChannel.name) {
              currentChannel.name = tvgNameMatch[1];
            }
            
            // Extract tvg-logo
            const tvgLogoMatch = attributes.match(/tvg-logo="([^"]*)"/);
            if (tvgLogoMatch) {
              currentChannel.logo = tvgLogoMatch[1];
            }
            
            // Extract group-title
            const groupMatch = attributes.match(/group-title="([^"]*)"/);
            if (groupMatch) {
              currentChannel.group = groupMatch[1];
            }
            
            // Extract EPG URL (tvg-url)
            const epgMatch = attributes.match(/tvg-url="([^"]*)"/);
            if (epgMatch) {
              currentChannel.epg = epgMatch[1];
            }
          }
          
          // Set default group if none specified
          if (!currentChannel.group) {
            currentChannel.group = 'Uncategorized';
          }
          
          groupSet.add(currentChannel.group);
        }
      } else if (line.startsWith('http')) {
        // Check if this URL has a video file extension (Movies/Shows indicator)
        if (hasVideoFileExtension(line)) {
          stoppedEarly = true;
          stopReason = `Detected Movies/Shows content at line ${totalLinesProcessed}`;
          const remainingLines = lines.length - i;
          
          console.log(`🎯 Smart parsing stopped: Found video file extension in URL`);
          console.log(`📍 URL: ${line}`);
          console.log(`📊 Statistics:`);
          console.log(`   • Processed: ${totalLinesProcessed}/${lines.length} lines`);
          console.log(`   • TV Channels imported: ${channels.length}`);
          console.log(`   • Skipped: ${remainingLines} remaining lines (Movies/Shows section)`);
          console.log(`   • Time saved: ~${Math.round((remainingLines / lines.length) * 100)}% faster processing`);
          
          break; // Stop parsing immediately
        }
        
        // This is a regular TV channel URL - process it
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
    
    // Log final parsing results
    if (stoppedEarly) {
      console.log(`✅ Smart parsing complete: ${channels.length} TV channels imported`);
      console.log(`🚀 Performance: Stopped early to focus on live TV channels only`);
    } else {
      console.log(`✅ Full parsing complete: ${channels.length} channels from ${totalLinesProcessed} lines`);
    }
    
    return {
      channels,
      groups: Array.from(groupSet).sort()
    };
  };

  const handleFile = async (file: File) => {
    if (!file.name.match(/\.(m3u|m3u8)$/i)) {
      setError('Please select a valid M3U or M3U8 file');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const text = await file.text();
      const totalLines = text.split('\n').length;
      
      console.log(`📁 Processing M3U file: ${file.name} (${totalLines.toLocaleString()} lines)`);
      
      const playlistData = parseM3U(text);
      
      if (playlistData.channels.length === 0) {
        throw new Error('No TV channels found in the playlist file');
      }
      
      // Enhanced success message indicating smart filtering
      const processedLines = totalLines;
      const channelLines = playlistData.channels.length * 2; // Approximate (EXTINF + URL per channel)
      const savedTime = processedLines > channelLines * 1.5;
      
      const baseMessage = `Successfully imported ${playlistData.channels.length} TV channels from ${playlistData.groups.length} groups`;
      const optimizationMessage = savedTime 
        ? ` (Smart filtering: Stopped at Movies/Shows section for faster processing)` 
        : '';
      
      setSuccess(baseMessage + optimizationMessage);
      onPlaylistParsed(playlistData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse playlist file');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    // Reset the input value so the same file can be selected again if needed
    event.target.value = '';
  };

  const handleUploadAreaClick = () => {
    if (!loading) {
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.click();
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only set drag over to false if we're leaving the drop zone entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const m3uFile = files.find(file => file.name.match(/\.(m3u|m3u8)$/i));
    
    if (m3uFile) {
      handleFile(m3uFile);
    } else {
      setError('Please drop a valid M3U or M3U8 file');
    }
  };

  const getDetailedErrorMessage = (error: Error): string => {
    const errorMessage = error.message.toLowerCase();
    
    // CORS error detection
    if (errorMessage.includes('cors') || 
        errorMessage.includes('cross-origin') ||
        errorMessage.includes('blocked') ||
        error.name === 'TypeError' && errorMessage.includes('fetch')) {
      return `CORS Error: The IPTV server doesn't allow browser requests. This is common with IPTV providers for security reasons.

**Workarounds:**
• Download the M3U file directly from your provider and use the "Upload File" option instead
• Use a CORS proxy service (not recommended for production)
• Use a desktop IPTV application that doesn't have CORS restrictions

**Why this happens:**
Most IPTV providers block browser requests to prevent unauthorized access and protect their servers.`;
    }
    
    // Network/DNS errors
    if (errorMessage.includes('network') || 
        errorMessage.includes('dns') ||
        errorMessage.includes('timeout')) {
      return `Network Error: Unable to reach the server. This could be due to:
• Server is temporarily down
• Internet connection issues
• DNS resolution problems
• Firewall blocking the request`;
    }
    
    // HTTP errors
    if (errorMessage.includes('404')) {
      return 'URL Not Found: The playlist URL appears to be incorrect or the file has been moved.';
    }
    
    if (errorMessage.includes('401') || errorMessage.includes('403')) {
      return 'Authentication Error: Invalid username, password, or access denied. Please check your IPTV credentials.';
    }
    
    if (errorMessage.includes('500') || errorMessage.includes('502') || errorMessage.includes('503')) {
      return 'Server Error: The IPTV server is experiencing issues. Please try again later.';
    }
    
    // Mixed content (HTTP on HTTPS site)
    if (errorMessage.includes('mixed content') || errorMessage.includes('insecure')) {
      return 'Security Error: Cannot load HTTP content on a secure HTTPS site. Try using an HTTPS URL or download the file instead.';
    }
    
    // Generic error with helpful context
    return `Failed to fetch playlist: ${error.message}

**Common solutions:**
• Verify the URL is correct and accessible
• Download the M3U file and use "Upload File" instead
• Check with your IPTV provider for alternative download methods`;
  };

  const handleUrlImport = async () => {
    if (!urlInput.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate URL format
      const url = new URL(urlInput.trim());
      
      // Check for common issues
      if (url.protocol === 'http:' && window.location.protocol === 'https:') {
        throw new Error('Mixed content: Cannot load HTTP content on HTTPS site. This is a browser security restriction.');
      }

      const response = await fetch(urlInput.trim(), {
        method: 'GET',
        mode: 'cors', // Explicitly request CORS
        headers: {
          'Accept': 'application/x-mpegURL, audio/x-mpegurl, audio/mpegurl, text/plain, */*',
          'User-Agent': 'IPTV-Playlist-Manager/1.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const text = await response.text();
      const totalLines = text.split('\n').length;
      
      console.log(`🌐 Processing M3U URL: ${urlInput.trim()} (${totalLines.toLocaleString()} lines)`);
      
      // Check if response looks like an M3U file
      if (!text.trim().startsWith('#EXTM3U') && !text.includes('#EXTINF:')) {
        throw new Error('Invalid M3U format: The URL did not return a valid M3U playlist file.');
      }
      
      const playlistData = parseM3U(text);
      
      if (playlistData.channels.length === 0) {
        throw new Error('No TV channels found in the playlist');
      }
      
      // Enhanced success message indicating smart filtering
      const channelLines = playlistData.channels.length * 2; // Approximate (EXTINF + URL per channel)
      const savedTime = totalLines > channelLines * 1.5;
      
      const baseMessage = `Successfully imported ${playlistData.channels.length} TV channels from ${playlistData.groups.length} groups`;
      const optimizationMessage = savedTime 
        ? ` (Smart filtering: Stopped at Movies/Shows section for faster processing)` 
        : '';
      
      setSuccess(baseMessage + optimizationMessage);
      onPlaylistParsed(playlistData);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(getDetailedErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-8">
      <div className="text-center">
        <h2 className="text-4xl font-bold mb-3">Import IPTV Playlist</h2>
        <p className="text-lg text-muted-foreground">
          Import your M3U playlist file or URL to get started with channel management
        </p>
      </div>

      {/* Smart Filtering Alert */}
      <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950/20 dark:text-green-200">
        <Filter className="h-5 w-5" />
        <AlertDescription className="text-base">
          <strong>Smart Channel Detection:</strong> The parser automatically detects and stops at Movies/TV Shows content (URLs ending with .mkv, .mp4, etc.), focusing only on live TV channels for optimal performance.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="file" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="file" className="flex items-center gap-3 text-lg">
            <Upload className="w-6 h-6" />
            Upload File
          </TabsTrigger>
          <TabsTrigger value="url" className="flex items-center gap-3 text-lg">
            <Link className="w-6 h-6" />
            Import URL
          </TabsTrigger>
        </TabsList>

        <TabsContent value="file" className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className="flex items-center gap-3 text-xl font-semibold mb-2">
                <Upload className="w-6 h-6" />
                Upload M3U File
              </h3>
              <p className="text-base text-muted-foreground">
                Select an M3U or M3U8 playlist file from your device
              </p>
            </div>

            <div className="space-y-4">
              {/* Hidden file input */}
              <input
                id="file-upload"
                type="file"
                accept=".m3u,.m3u8"
                onChange={handleFileUpload}
                disabled={loading}
                className="sr-only"
              />
              
              {/* Custom upload area */}
              <div
                className={`relative border-2 border-dashed rounded-lg p-8 transition-all duration-200 ${
                  isDragOver
                    ? 'border-primary bg-primary/5 scale-[1.02]'
                    : 'border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50'
                } ${loading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleUploadAreaClick}
              >
                <div className="flex flex-col items-center gap-4 text-center">
                  {loading ? (
                    <Loader2 className="w-16 h-16 animate-spin text-primary" />
                  ) : (
                    <div className={`p-4 rounded-full transition-colors ${
                      isDragOver ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      <Upload className="w-10 h-10" />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <h3 className="text-xl font-medium">
                      {loading ? 'Processing file...' : 
                       isDragOver ? 'Drop your file here' : 
                       'Choose M3U file or drag & drop'}
                    </h3>
                    <p className="text-base text-muted-foreground">
                      {loading ? 'Please wait while we parse your playlist' :
                       'Supports .m3u and .m3u8 files up to 10MB'}
                    </p>
                  </div>
                  
                  {!loading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="w-5 h-5" />
                      <span>M3U, M3U8</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="url" className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className="flex items-center gap-3 text-xl font-semibold mb-2">
                <Link className="w-6 h-6" />
                Import from URL
              </h3>
              <p className="text-base text-muted-foreground">
                Enter the URL of an M3U playlist to import it directly
              </p>
            </div>

            {/* CORS Warning */}
            <Alert className="border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/20 dark:text-blue-200">
              <Info className="h-5 w-5" />
              <AlertDescription className="text-base">
                <strong>Note:</strong> Many IPTV URLs may fail due to CORS restrictions. If the URL fails, try downloading the M3U file and using the "Upload File" option instead.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div>
                <Label htmlFor="url-input" className="text-base">Playlist URL</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="url-input"
                    type="url"
                    placeholder="https://example.com/playlist.m3u"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    disabled={loading}
                    className="flex-1 text-base"
                  />
                  <Button 
                    onClick={handleUrlImport} 
                    disabled={loading || !urlInput.trim()}
                    className="flex items-center gap-2 text-base px-6"
                    size="lg"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Link className="w-5 h-5" />
                    )}
                    Import
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Status Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription className="text-base whitespace-pre-line">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950/20 dark:text-green-200">
          <CheckCircle className="h-5 w-5" />
          <AlertDescription className="text-base">{success}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}