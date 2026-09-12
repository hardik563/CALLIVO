import React from 'react';
import { Participant, MeetingViewMode } from '../../types';
import { ParticipantTile } from './ParticipantTile';
import { cn } from '../../lib/utils';

interface ParticipantGridProps {
  participants: Participant[];
  localStream: MediaStream | null;
  virtualBackground: string;
  viewMode: MeetingViewMode;
}

export const ParticipantGrid: React.FC<ParticipantGridProps> = ({
  participants,
  localStream,
  virtualBackground,
  viewMode,
}) => {
  const count = participants.length;

  // Find active speaker or pinned participant
  const activeSpeaker =
    participants.find((p) => p.isPinned) ||
    participants.find((p) => p.isSpeaking && !p.isLocal) ||
    participants[0];

  // Speaker Mode Layout
  if (viewMode === 'speaker' && activeSpeaker) {
    const otherParticipants = participants.filter((p) => p.id !== activeSpeaker.id);

    return (
      <div className="w-full h-full flex flex-col lg:flex-row gap-3 p-3 overflow-hidden">
        {/* Main Stage Active Speaker */}
        <div className="flex-1 h-full min-h-[350px]">
          <ParticipantTile
            participant={activeSpeaker}
            localStream={activeSpeaker.isLocal ? localStream : null}
            virtualBackground={virtualBackground}
            isLarge={true}
          />
        </div>

        {/* Thumbnail Filmstrip */}
        {otherParticipants.length > 0 && (
          <div className="w-full lg:w-64 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto shrink-0 max-h-48 lg:max-h-full">
            {otherParticipants.map((p) => (
              <div key={p.id} className="w-48 lg:w-full h-32 shrink-0">
                <ParticipantTile
                  participant={p}
                  localStream={p.isLocal ? localStream : null}
                  virtualBackground={virtualBackground}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Dynamic Adaptive Grid for Standard & Gallery View
  const getGridClasses = () => {
    if (count === 1) return 'grid-cols-1 grid-rows-1 max-w-5xl';
    if (count === 2) return 'grid-cols-1 md:grid-cols-2 max-w-6xl';
    if (count <= 4) return 'grid-cols-1 sm:grid-cols-2 grid-rows-2 max-w-6xl';
    if (count <= 6) return 'grid-cols-2 sm:grid-cols-3 max-w-7xl';
    if (count <= 9) return 'grid-cols-2 md:grid-cols-3 max-w-7xl';
    return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 max-w-full';
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-3 sm:p-4 overflow-hidden">
      <div
        className={cn(
          'w-full h-full grid gap-3 sm:gap-4 auto-rows-fr items-center justify-center',
          getGridClasses()
        )}
      >
        {participants.map((participant) => (
          <div key={participant.id} className="w-full h-full min-h-[160px] sm:min-h-[200px]">
            <ParticipantTile
              participant={participant}
              localStream={participant.isLocal ? localStream : null}
              virtualBackground={virtualBackground}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
