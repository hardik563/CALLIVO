import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { webrtcManager, ConnectionStats } from '../../lib/webrtc';
import {
  Wifi,
  Activity,
  Gauge,
  Video,
  Mic,
  Server,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Volume2,
} from 'lucide-react';

interface ConnectionDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConnectionDiagnosticsModal: React.FC<ConnectionDiagnosticsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [stats, setStats] = useState<ConnectionStats | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStats = async () => {
    setIsRefreshing(true);
    try {
      const currentStats = await webrtcManager.getDiagnostics();
      setStats(currentStats);
    } catch (err) {
      console.warn('Diagnostics error:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStats();
      const interval = setInterval(fetchStats, 2000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const ratingColors = {
    excellent: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    good: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    poor: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
  };

  const ratingIcons = {
    excellent: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
    good: <AlertTriangle className="w-4 h-4 text-amber-400" />,
    poor: <AlertTriangle className="w-4 h-4 text-rose-400" />,
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="WebRTC Connection & Stream Diagnostics"
      description="Live network performance metrics, peer telemetry, and codec negotiation."
      maxWidth="md"
    >
      <div className="space-y-4 py-2">
        {/* Rating Overview Card */}
        {stats && (
          <div className="flex items-center justify-between p-3 rounded-2xl bg-surface border border-slate-700/80">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400">
                <Wifi className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Network Health</p>
                <p className="text-[11px] text-slate-400">
                  {stats.peersCount} remote peer{stats.peersCount === 1 ? '' : 's'} connected • State:{' '}
                  <span className="text-emerald-400 font-mono capitalize">{stats.connectionState}</span>
                </p>
              </div>
            </div>

            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold capitalize ${
                ratingColors[stats.rating]
              }`}
            >
              {ratingIcons[stats.rating]}
              <span>{stats.rating}</span>
            </div>
          </div>
        )}

        {/* 2x2 Telemetry Grid */}
        {stats ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {/* Round Trip Time */}
            <div className="p-3 rounded-xl bg-surface border border-slate-700/80 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <Activity className="w-3.5 h-3.5 text-brand-400" />
                <span>Latency (RTT)</span>
              </div>
              <p className="text-base font-bold font-mono text-white">
                {stats.rttMs} <span className="text-xs font-normal text-slate-400">ms</span>
              </p>
            </div>

            {/* Packet Loss */}
            <div className="p-3 rounded-xl bg-surface border border-slate-700/80 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <Gauge className="w-3.5 h-3.5 text-amber-400" />
                <span>Packet Loss</span>
              </div>
              <p className="text-base font-bold font-mono text-white">
                {stats.packetLossPercent}%
              </p>
            </div>

            {/* Jitter */}
            <div className="p-3 rounded-xl bg-surface border border-slate-700/80 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <Activity className="w-3.5 h-3.5 text-purple-400" />
                <span>Jitter</span>
              </div>
              <p className="text-base font-bold font-mono text-white">
                {stats.jitterMs} <span className="text-xs font-normal text-slate-400">ms</span>
              </p>
            </div>

            {/* Video Resolution & FPS */}
            <div className="p-3 rounded-xl bg-surface border border-slate-700/80 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <Video className="w-3.5 h-3.5 text-emerald-400" />
                <span>Resolution</span>
              </div>
              <p className="text-xs font-bold font-mono text-white">
                {stats.resolution} @ {stats.framerate}fps
              </p>
            </div>

            {/* Outbound Bitrate */}
            <div className="p-3 rounded-xl bg-surface border border-slate-700/80 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <Gauge className="w-3.5 h-3.5 text-sky-400" />
                <span>Send Bitrate</span>
              </div>
              <p className="text-xs font-bold font-mono text-white">
                {stats.sendBitrateKbps} <span className="text-[10px] text-slate-400">kbps</span>
              </p>
            </div>

            {/* Inbound Bitrate */}
            <div className="p-3 rounded-xl bg-surface border border-slate-700/80 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <Gauge className="w-3.5 h-3.5 text-indigo-400" />
                <span>Receive Bitrate</span>
              </div>
              <p className="text-xs font-bold font-mono text-white">
                {stats.recvBitrateKbps} <span className="text-[10px] text-slate-400">kbps</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-slate-400">Loading diagnostics...</div>
        )}

        {/* Codec & ICE Details */}
        {stats && (
          <div className="p-3 rounded-xl bg-surface border border-slate-700/80 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Mic className="w-3.5 h-3.5 text-brand-400" /> Audio Packets:
              </span>
              <span className="font-mono text-[11px] text-emerald-400">
                TX: {stats.audioPacketsSent} pkts ({stats.audioBytesSent}B) | RX: {stats.audioPacketsReceived} pkts ({stats.audioBytesReceived}B)
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Activity className="w-3.5 h-3.5 text-purple-400" /> Audio Negotiation:
              </span>
              <span className="font-mono text-[11px] text-sky-400">
                SDP: {stats.audioCurrentDirection || 'unknown'} (cfg: {stats.audioDirection}) | Loss: {stats.audioPacketsLost} | Jitter: {stats.audioJitterMs}ms
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Volume2 className="w-3.5 h-3.5 text-sky-400" /> Audio Playback:
              </span>
              <div className="flex items-center gap-2">
                <span className={`font-mono text-[11px] font-semibold ${stats.isAudioElementPlaying ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {stats.isAudioElementPlaying ? 'Playing' : 'Paused/Buffering'}
                </span>
                <span className={`font-mono text-[11px] ${stats.isAudioAutoplayBlocked ? 'text-rose-400' : 'text-slate-400'}`}>
                  ({stats.isAudioAutoplayBlocked ? 'Blocked' : 'Unlocked'})
                </span>
                {stats.isAudioAutoplayBlocked && (
                  <button
                    onClick={() => webrtcManager.unlockAudio()}
                    className="px-2 py-0.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-[10px] cursor-pointer"
                  >
                    Unlock
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Mic className="w-3.5 h-3.5 text-brand-400" /> Audio Codec:
              </span>
              <span className="font-mono text-[11px]">{stats.audioCodec}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Video className="w-3.5 h-3.5 text-emerald-400" /> Video Codec:
              </span>
              <span className="font-mono text-[11px]">{stats.videoCodec}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Server className="w-3.5 h-3.5 text-purple-400" /> ICE Candidate Routing:
              </span>
              <span className="font-mono text-[11px] uppercase">{stats.iceCandidateType}</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchStats}
            isLoading={isRefreshing}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            Refresh Telemetry
          </Button>
          <Button variant="primary" size="sm" onClick={onClose} className="text-xs">
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};
