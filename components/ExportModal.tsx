import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Download, Globe, Copy, Check, ExternalLink, Tv, Server, Edit, FileText, AlertTriangle, Cloud } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import type { PlaylistData, Channel } from '../App';
import type { User } from '@supabase/supabase-js';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlistData: PlaylistData;
  modifiedChannels: Channel[];
  user: User;
}

export function ExportModal({ isOpen, onClose, playlistData, modifiedChannels, user }: ExportModalProps) {
  const [isGeneratingUrl, setIsGeneratingUrl] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string>('');
  const [urlCopied, setUrlCopied] = useState(false);
  const [copyMethod, setCopyMethod] = useState<'none' | 'clipboard' | 'selection' | 'manual'>('none');

  const generateM3UContent = () => {
    let m3uContent = '#EXTM3U\n';
    
    modifiedChannels.forEach(channel => {
      const logoAttr = channel.logo ? ` tvg-logo="${channel.logo}"` : '';
      const epgAttr = channel.epg ? ` tvg-url="${channel.epg}"` : '';
      const tvgIdAttr = channel.tvgId ? ` tvg-id="${channel.tvgId}"` : '';
      const groupAttr = channel.group ? ` group-title="${channel.group}"` : '';
      
      m3uContent += `#EXTINF:-1${logoAttr}${epgAttr}${tvgIdAttr}${groupAttr},${channel.name}\n`;
      m3uContent += `${channel.url}\n`;
    });

    return m3uContent;
  };

  const handleDownload = () => {
    if (modifiedChannels.length === 0) {
      toast.error('No modified channels to export');
      return;
    }

    const m3uContent = generateM3UContent();
    const blob = new Blob([m3uContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'epg_updates.m3u';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success(`EPG updates for ${modifiedChannels.length} channels downloaded successfully!`);
    onClose();
  };

  const handleGenerateUrl = async () => {
    if (modifiedChannels.length === 0) {
      toast.error('No modified channels to export');
      return;
    }

    setIsGeneratingUrl(true);
    
    try {
      const m3uContent = generateM3UContent();
      const fileName = `${user.id}/epg_updates.m3u`;
      
      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('epg-playlists')
        .upload(fileName, m3uContent, {
          contentType: 'text/plain',
          upsert: true // This will overwrite existing file
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('epg-playlists')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      // Save/update EPG file record in database
      const { error: dbError } = await supabase
        .from('epg_files')
        .upsert({
          user_id: user.id,
          file_path: fileName,
          public_url: publicUrl,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (dbError) {
        throw dbError;
      }

      setGeneratedUrl(publicUrl);
      toast.success(`EPG updates URL generated for ${modifiedChannels.length} channels!`);
    } catch (error) {
      console.error('Error generating URL:', error);
      toast.error('Failed to generate URL. Please try again.');
    } finally {
      setIsGeneratingUrl(false);
    }
  };

  const handleCopyUrl = async () => {
    if (!generatedUrl || generatedUrl.trim() === '') {
      toast.error('No URL available to copy. Please generate a URL first.');
      return;
    }

    setUrlCopied(false);
    setCopyMethod('none');

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(generatedUrl);
        setUrlCopied(true);
        setCopyMethod('clipboard');
        toast.success('URL copied to clipboard!');
        setTimeout(() => setUrlCopied(false), 2000);
        return;
      }

      const textArea = document.createElement('textarea');
      textArea.value = generatedUrl;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.style.opacity = '0';
      textArea.style.pointerEvents = 'none';
      textArea.setAttribute('readonly', '');
      textArea.setAttribute('tabindex', '-1');
      
      document.body.appendChild(textArea);
      
      try {
        textArea.focus();
        textArea.select();
        textArea.setSelectionRange(0, 99999);
        
        const successful = document.execCommand('copy');
        if (successful) {
          setUrlCopied(true);
          setCopyMethod('selection');
          toast.success('URL copied to clipboard!');
          setTimeout(() => setUrlCopied(false), 2000);
        } else {
          throw new Error('execCommand copy failed');
        }
      } catch (execError) {
        console.warn('execCommand copy failed:', execError);
        selectUrlForManualCopy();
      } finally {
        document.body.removeChild(textArea);
      }
    } catch (error) {
      console.error('All copy methods failed:', error);
      selectUrlForManualCopy();
    }
  };

  const selectUrlForManualCopy = () => {
    try {
      const urlInput = document.getElementById('generated-url') as HTMLInputElement;
      if (urlInput) {
        urlInput.focus();
        urlInput.select();
        urlInput.setSelectionRange(0, 99999);
        setCopyMethod('manual');
        toast.info('URL selected. Press Ctrl+C (or Cmd+C on Mac) to copy manually.', {
          duration: 5000,
        });
      } else {
        throw new Error('URL input field not found');
      }
    } catch (error) {
      console.error('Manual copy setup failed:', error);
      toast.error('Copy failed. Please manually select and copy the URL from the input field.');
    }
  };

  const resetModal = () => {
    setGeneratedUrl('');
    setUrlCopied(false);
    setIsGeneratingUrl(false);
    setCopyMethod('none');
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (modifiedChannels.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export Playlist
            </DialogTitle>
            <DialogDescription>
              No channels have been modified yet.
            </DialogDescription>
          </DialogHeader>

          <div className="text-center py-8">
            <Edit className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No EPG Updates to Export</h3>
            <p className="text-muted-foreground mb-4">
              You haven't assigned EPG data to any channels yet. Add EPG information to channels 
              in the Channel Manager, then return here to export your updates.
            </p>
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export EPG Updates
          </DialogTitle>
          <DialogDescription>
            Export only the channels with EPG updates. Your files are securely stored in the cloud.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Summary */}
          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Cloud className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                <div className="space-y-2 flex-1">
                  <h3 className="font-medium text-blue-900 dark:text-blue-100">Cloud Storage Enabled</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-200">
                    Your EPG updates are automatically saved to your cloud account and will persist across sessions.
                    Only modified channels are exported to keep file sizes small.
                  </p>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div className="flex items-center gap-2">
                      <Edit className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-blue-700 dark:text-blue-200">Modified:</span>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                        {modifiedChannels.length}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Tv className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-blue-700 dark:text-blue-200">Total:</span>
                      <Badge variant="outline" className="border-blue-300 text-blue-700 dark:border-blue-600 dark:text-blue-300">
                        {playlistData.channels.length}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Download Option */}
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={handleDownload}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Download className="w-5 h-5 text-blue-500" />
                  Download Updates
                </CardTitle>
                <CardDescription>
                  Download M3U file with EPG updates only
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Check className="w-3 h-3 text-green-500" />
                    Small file size
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Check className="w-3 h-3 text-green-500" />
                    No vendor conflicts
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Check className="w-3 h-3 text-green-500" />
                    Easy to merge
                  </div>
                </div>
                <Button className="w-full mt-4" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Download ({modifiedChannels.length} channels)
                </Button>
              </CardContent>
            </Card>

            {/* Cloud URL Option */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Cloud className="w-5 h-5 text-green-500" />
                  Cloud Hosted URL
                </CardTitle>
                <CardDescription>
                  Generate persistent cloud URL for EPG updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Check className="w-3 h-3 text-green-500" />
                    Persistent URL
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Check className="w-3 h-3 text-green-500" />
                    Auto-updates
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Check className="w-3 h-3 text-green-500" />
                    Secure cloud storage
                  </div>
                </div>
                <Button 
                  className="w-full mt-4" 
                  variant="outline"
                  onClick={handleGenerateUrl}
                  disabled={isGeneratingUrl}
                >
                  {isGeneratingUrl ? (
                    <>
                      <Server className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Cloud className="w-4 h-4 mr-2" />
                      Generate URL ({modifiedChannels.length})
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Generated URL Section */}
          {generatedUrl && (
            <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-green-800 dark:text-green-200">
                  <ExternalLink className="w-5 h-5" />
                  Your Cloud EPG URL
                </CardTitle>
                <CardDescription className="text-green-700 dark:text-green-300">
                  This persistent URL contains your EPG updates ({modifiedChannels.length} channels) and will 
                  automatically update when you make changes. Use alongside your main vendor playlist.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="generated-url" className="text-green-800 dark:text-green-200">
                    Cloud EPG Updates URL
                  </Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="generated-url"
                      value={generatedUrl}
                      readOnly
                      className="font-mono text-sm bg-white dark:bg-green-950/40 border-green-300 dark:border-green-700"
                    />
                    <Button
                      size="sm"
                      variant={urlCopied ? "default" : "outline"}
                      onClick={handleCopyUrl}
                      disabled={!generatedUrl}
                      className={urlCopied ? "bg-green-600 hover:bg-green-700" : "border-green-300 hover:bg-green-100 dark:hover:bg-green-900"}
                    >
                      {urlCopied ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  
                  {copyMethod === 'manual' && (
                    <div className="flex items-center gap-2 mt-2 p-2 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded text-sm">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      <span className="text-yellow-700 dark:text-yellow-300">
                        URL selected. Press <kbd className="px-1 py-0.5 bg-yellow-100 dark:bg-yellow-900 rounded text-xs">Ctrl+C</kbd> (or <kbd className="px-1 py-0.5 bg-yellow-100 dark:bg-yellow-900 rounded text-xs">Cmd+C</kbd> on Mac) to copy.
                      </span>
                    </div>
                  )}
                </div>

                <div className="bg-white dark:bg-green-950/40 p-3 rounded border border-green-300 dark:border-green-700">
                  <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                    Usage Instructions:
                  </h4>
                  <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                    <div>• Add this as a secondary M3U source in your IPTV player</div>
                    <div>• Keep your main vendor playlist as the primary source</div>
                    <div>• EPG data will merge automatically in most players</div>
                    <div>• URL updates automatically when you make changes</div>
                    <div>• Compatible with VLC, Perfect Player, IPTV Smarters, and more</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleCopyUrl} 
                    className="flex-1"
                    disabled={!generatedUrl}
                  >
                    {urlCopied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy URL
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={handleClose}>
                    Done
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {!generatedUrl && (
            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}