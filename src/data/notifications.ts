import { AppNotification } from '../types';

export const sampleNotifications: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'Meeting starting in 10 minutes',
    message: 'Executive Product Architecture Sync with Elena and Marcus is starting at 2:00 PM.',
    time: '10 min ago',
    type: 'meeting',
    isRead: false,
    actionUrl: '/meetings/clv-849-2180/lobby',
  },
  {
    id: 'notif-2',
    title: 'Meeting invitation received',
    message: 'Sofia Al-Mansoor invited you to "Weekly All-Hands & Company Milestone".',
    time: '1 hour ago',
    type: 'invite',
    isRead: false,
    actionUrl: '/meetings',
  },
  {
    id: 'notif-3',
    title: 'Recording ready to view',
    message: 'Recording for "Sprint 24 Architecture & Spatial Engine Deep Dive" has finished processing.',
    time: '3 hours ago',
    type: 'recording',
    isRead: true,
    actionUrl: '/recordings',
  },
  {
    id: 'notif-4',
    title: 'Elena sent you a message',
    message: '"Let us review the WebRTC turn server latency graph after the call."',
    time: '4 hours ago',
    type: 'message',
    isRead: true,
    actionUrl: '/messages',
  },
  {
    id: 'notif-5',
    title: 'System update completed',
    message: 'Spatial Room Engine upgraded to v2.4 with adaptive WebGL mesh compression.',
    time: 'Yesterday',
    type: 'system',
    isRead: true,
  }
];
