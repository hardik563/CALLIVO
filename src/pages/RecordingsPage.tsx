import React, { useState, useEffect } from 'react';
import { Recording } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { useToast } from '../components/ui/Toast';
import { copyToClipboard } from '../lib/utils';
import {
  Play,
  Share2,
  Download,
  Edit2,
  Trash2,
  Clock,
  HardDrive,
  Film,
  Search,
} from 'lucide-react';

import { recordingsApi } from '../lib/api';
import { ImageWithFallback } from '../components/ui/ImageWithFallback';

export const RecordingsPage: React.FC = () => {
  const { success, warning } = useToast();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activePlayback, setActivePlayback] = useState<Recording | null>(null);
  const [editingRecording, setEditingRecording] = useState<Recording | null>(null);

  useEffect(() => {
    recordingsApi.list().then((res) => {
      if (res.success && Array.isArray(res.recordings)) {
        const mapped: Recording[] = res.recordings.map((r: any) => ({
          id: r.id,
          meetingId: r.meetingId,
          meetingTitle: r.meetingTitle,
          date: new Date(r.createdAt).toLocaleDateString(),
          duration: r.duration,
          size: r.size,
          thumbnail: r.thumbnailUrl || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=480&auto=format&fit=crop&q=80',
          downloadUrl: r.videoUrl || '#',
          participants: [],
          isStarred: false,
        }));
        setRecordings(mapped);
      }
    }).catch((err) => {
      console.warn('Recordings fetch warning:', err);
    }).finally(() => {
      setIsLoading(false);
    });
  }, []);

  const filteredRecordings = recordings.filter((r) =>
    r.meetingTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.meetingId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleShare = async (recording: Recording) => {
    await copyToClipboard(`${window.location.origin}/recordings/${recording.id}`);
    success('Share Link Copied', recording.meetingTitle);
  };

  const handleDownload = (recording: Recording) => {
    success('Download Started', `Downloading "${recording.meetingTitle}.mp4" (${recording.size})`);
  };

  const handleDelete = (id: string) => {
    setRecordings((prev) => prev.filter((r) => r.id !== id));
    warning('Recording Deleted', 'File removed from cloud storage.');
  };

  const handleSaveRename = () => {
    if (!editingRecording) return;
    setRecordings((prev) =>
      prev.map((r) => (r.id === editingRecording.id ? editingRecording : r))
    );
    success('Recording Renamed', editingRecording.meetingTitle);
    setEditingRecording(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Cloud Recordings</h1>
          <p className="text-xs text-slate-400 mt-1">Review, playback, share, and export previous meetings</p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search recordings..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surface-elevated/70 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* Grid of Recording Cards */}
      {filteredRecordings.length === 0 ? (
        <EmptyState
          icon={<Film className="w-8 h-8" />}
          title="No recordings found"
          description="Start a meeting and click 'Start Recording' from the meeting controls to generate cloud archives."
          actionLabel="Clear Filter"
          onAction={() => setSearchQuery('')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecordings.map((recording) => (
            <Card
              key={recording.id}
              interactive={true}
              glow={true}
              className="p-0 overflow-hidden flex flex-col justify-between"
            >
              {/* Thumbnail with Play Overlay */}
              <div
                onClick={() => setActivePlayback(recording)}
                className="relative aspect-video w-full bg-slate-900 group cursor-pointer overflow-hidden"
              >
                <ImageWithFallback
                  src={recording.thumbnail}
                  alt={recording.meetingTitle}
                  fallbackVariant="recording"
                  fallbackText={recording.meetingTitle}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 filter brightness-90"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-brand-600/90 group-hover:bg-brand-500 text-white flex items-center justify-center shadow-glow transition-all group-hover:scale-110">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                </div>

                {/* Duration Badge */}
                <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/75 backdrop-blur-md text-[10px] font-mono text-white flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {recording.duration}
                </div>
              </div>

              {/* Card Meta & Details */}
              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{recording.date}</span>
                    <span className="flex items-center gap-1">
                      <HardDrive className="w-3 h-3 text-slate-500" /> {recording.size}
                    </span>
                  </div>

                  <h3
                    onClick={() => setActivePlayback(recording)}
                    className="text-sm font-semibold text-white hover:text-brand-300 transition-colors cursor-pointer line-clamp-2"
                  >
                    {recording.meetingTitle}
                  </h3>

                  <p className="text-[11px] text-slate-400 truncate">
                    Participants: {recording.participants.join(', ')}
                  </p>
                </div>

                {/* Action Controls */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setActivePlayback(recording)}
                    leftIcon={<Play className="w-3.5 h-3.5 fill-current" />}
                    className="text-xs"
                  >
                    Play
                  </Button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleShare(recording)}
                      className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Share link"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDownload(recording)}
                      className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Download MP4"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setEditingRecording(recording)}
                      className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Rename"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(recording.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete recording"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Video Playback Modal */}
      {activePlayback && (
        <Modal
          isOpen={true}
          onClose={() => setActivePlayback(null)}
          title={activePlayback.meetingTitle}
          description={`Recorded on ${activePlayback.date} • Duration: ${activePlayback.duration}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 pt-2">
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-2xl">
              <video
                controls
                autoPlay
                src={activePlayback.videoUrl}
                poster={activePlayback.thumbnail}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400 font-mono">
                Meeting ID: {activePlayback.meetingId}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShare(activePlayback)}
                  leftIcon={<Share2 className="w-3.5 h-3.5" />}
                >
                  Share
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleDownload(activePlayback)}
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                >
                  Download
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Rename Modal */}
      {editingRecording && (
        <Modal
          isOpen={true}
          onClose={() => setEditingRecording(null)}
          title="Rename Recording"
          description="Update the title for this archived meeting."
          maxWidth="sm"
        >
          <div className="space-y-4 pt-2">
            <Input
              label="Recording Title"
              value={editingRecording.meetingTitle}
              onChange={(e) =>
                setEditingRecording({ ...editingRecording, meetingTitle: e.target.value })
              }
              required
              autoFocus
            />

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <Button variant="ghost" size="sm" onClick={() => setEditingRecording(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveRename}>
                Save Title
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
