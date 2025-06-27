import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { 
  Zap, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Globe,
  AlertTriangle,
  Tv,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import type { Channel } from '../App';

interface BulkEPGResult {
  channelId: string;
  channelName: string;
  success: boolean;
  epgUrl?: string;
  error?: string;
}

interface BulkEPGModalProps {
  isOpen: boolean;
  onClose: () => void;
  channels: Channel[];
  onBulkUpdate: (updates: Array<{ channelId: string; epgUrl: string }>) => void;
}

export function BulkEPGModal({ isOpen, onClose, channels, onBulkUpdate }: BulkEPGModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentChannel, setCurrentChannel] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<BulkEPGResult[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  // Get channels without EPG
  const channelsWithoutEPG = channels.filter(channel => !channel.epg && !channel.tvgId);

  const mockEPGSources = [
    'https://epg.example.com/xmltv.xml',
    'https://tv-guide.example.com/epg.xml',
    'https://xmltv.example.org/guide.xml',
    'https://epg-service.example.net/data.xml',
    'https://iptv-epg.example.com/xmltv.xml'
  ];

  const simulateEPGSearch = async (channel: Channel): Promise<BulkEPGResult> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));

    // 80% success rate for simulation
    const success = Math.random() > 0.2;
    
    if (success) {
      const epgUrl = mockEPGSources[Math.floor(Math.random() * mockEPGSources.length)];
      return {
        channelId: channel.id,
        channelName: channel.name,
        success: true,
        epgUrl
      };
    } else {
      const errors = [
        'No EPG data found',
        'Network timeout',
        'Service unavailable',
        'Channel not found in EPG database'
      ];
      return {
        channelId: channel.id,
        channelName: channel.name,
        success: false,
        error: errors[Math.floor(Math.random() * errors.length)]
      };
    }
  };

  const startBulkEPGAssignment = async () => {
    if (channelsWithoutEPG.length === 0) {
      toast.error('No channels without EPG found');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setResults([]);
    setIsComplete(false);

    const newResults: BulkEPGResult[] = [];

    for (let i = 0; i < channelsWithoutEPG.length; i++) {
      const channel = channelsWithoutEPG[i];
      setCurrentChannel(channel.name);
      
      try {
        const result = await simulateEPGSearch(channel);
        newResults.push(result);
        setResults([...newResults]);
        
        const progressPercent = ((i + 1) / channelsWithoutEPG.length) * 100;
        setProgress(progressPercent);
      } catch (error) {
        newResults.push({
          channelId: channel.id,
          channelName: channel.name,
          success: false,
          error: 'Unexpected error occurred'
        });
      }
    }

    // Apply successful updates
    const successfulUpdates = newResults
      .filter(result => result.success && result.epgUrl)
      .map(result => ({
        channelId: result.channelId,
        epgUrl: result.epgUrl!
      }));

    if (successfulUpdates.length > 0) {
      onBulkUpdate(successfulUpdates);
    }

    setIsProcessing(false);
    setIsComplete(true);
    setCurrentChannel('');

    const successCount = newResults.filter(r => r.success).length;
    const failureCount = newResults.length - successCount;

    toast.success(`Bulk EPG assignment complete! ${successCount} successful, ${failureCount} failed.`);
  };

  const handleClose = () => {
    if (!isProcessing) {
      setResults([]);
      setProgress(0);
      setIsComplete(false);
      setCurrentChannel('');
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen && !isProcessing && !isComplete && results.length === 0) {
      // Reset state when modal opens
      setResults([]);
      setProgress(0);
      setIsComplete(false);
      setCurrentChannel('');
    }
  }, [isOpen]);

  const successCount = results.filter(r => r.success).length;
  const failureCount = results.length - successCount;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Bulk EPG Assignment
          </DialogTitle>
          <DialogDescription>
            {!isProcessing && !isComplete && (
              `Automatically search and assign EPG data to ${channelsWithoutEPG.length} channels without EPG.`
            )}
            {isProcessing && (
              `Processing ${channelsWithoutEPG.length} channels... Please wait.`
            )}
            {isComplete && (
              `Bulk EPG assignment completed. Review the results below.`
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-6 overflow-hidden">
          {/* Pre-process Summary */}
          {!isProcessing && !isComplete && (
            <Card className="flex-shrink-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Search className="w-8 h-8 text-blue-500" />
                    <div>
                      <h3 className="font-medium">Ready to Process</h3>
                      <p className="text-sm text-muted-foreground">
                        {channelsWithoutEPG.length} channels without EPG will be processed
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {channelsWithoutEPG.length}
                  </Badge>
                </div>
                
                {channelsWithoutEPG.length === 0 ? (
                  <div className="mt-4 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-green-700 dark:text-green-300">
                        All channels already have EPG data assigned!
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex justify-center">
                    <Button onClick={startBulkEPGAssignment} className="flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Start Bulk Assignment
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Processing State */}
          {isProcessing && (
            <Card className="flex-shrink-0">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                    <div className="flex-1">
                      <h3 className="font-medium">Processing Channels</h3>
                      <p className="text-sm text-muted-foreground">
                        Currently processing: {currentChannel}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {Math.round(progress)}%
                    </Badge>
                  </div>
                  
                  <Progress value={progress} className="w-full" />
                  
                  <div className="text-center text-sm text-muted-foreground">
                    {results.length} of {channelsWithoutEPG.length} processed
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {(results.length > 0 || isComplete) && (
            <Card className="flex-1 flex flex-col overflow-hidden">
              <CardContent className="p-4 flex flex-col h-full overflow-hidden">
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                  <h3 className="font-medium">Results</h3>
                  <div className="flex gap-2">
                    {successCount > 0 && (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {successCount} Success
                      </Badge>
                    )}
                    {failureCount > 0 && (
                      <Badge variant="destructive">
                        <XCircle className="w-3 h-3 mr-1" />
                        {failureCount} Failed
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="space-y-2 pr-2">
                      {results.map((result, index) => (
                        <div
                          key={result.channelId}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            result.success 
                              ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' 
                              : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {result.success ? (
                              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm truncate">{result.channelName}</p>
                              {result.success && result.epgUrl && (
                                <p className="text-xs text-muted-foreground font-mono truncate">
                                  {result.epgUrl}
                                </p>
                              )}
                              {!result.success && result.error && (
                                <p className="text-xs text-red-600 dark:text-red-400 truncate">
                                  {result.error}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {result.success && (
                            <Badge variant="outline" className="text-xs flex-shrink-0 ml-2">
                              <Globe className="w-3 h-3 mr-1" />
                              EPG Added
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 flex-shrink-0 pt-4 border-t">
            {!isProcessing && channelsWithoutEPG.length === 0 && (
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
            )}
            
            {!isProcessing && channelsWithoutEPG.length > 0 && !isComplete && (
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
            )}
            
            {isComplete && (
              <Button onClick={handleClose}>
                Done
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}