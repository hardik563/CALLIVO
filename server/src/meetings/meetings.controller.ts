import { Router, Request, Response } from 'express';
import { meetingsService } from './meetings.service';
import { requireAuth, optionalAuth } from '../common/auth.middleware';
import { prisma } from '../db/prisma';

const router = Router();

// Create meeting (instant or scheduled)
router.post('/', optionalAuth, async (req: Request, res: Response, next) => {
  try {
    const meeting = await meetingsService.createMeeting(req.user?.userId, req.body);
    res.status(201).json({ success: true, meeting });
  } catch (err) {
    next(err);
  }
});

// List user meetings
router.get('/', requireAuth, async (req: Request, res: Response, next) => {
  try {
    const meetings = await meetingsService.getUserMeetings(req.user!.userId);
    res.json({ success: true, meetings });
  } catch (err) {
    next(err);
  }
});

// Get meeting by ID
router.get('/:id', optionalAuth, async (req: Request, res: Response, next) => {
  try {
    const meeting = await meetingsService.getMeetingById(String(req.params.id), req.user?.userId);
    res.json({ success: true, meeting });
  } catch (err) {
    next(err);
  }
});

// Check/verify lobby
router.post('/:id/lobby', optionalAuth, async (req: Request, res: Response, next) => {
  try {
    const { guestName, passcode } = req.body;
    const lobbyInfo = await meetingsService.joinLobby(
      String(req.params.id),
      req.user?.userId,
      guestName,
      passcode
    );
    res.json({ success: true, ...lobbyInfo });
  } catch (err) {
    next(err);
  }
});

// Real REST join meeting: registers/upserts participant in DB
router.post('/:id/join', optionalAuth, async (req: Request, res: Response, next) => {
  try {
    const { guestName, passcode } = req.body;
    const joinResult = await meetingsService.joinMeeting(
      String(req.params.id),
      req.user?.userId,
      guestName,
      passcode
    );
    res.json({ success: true, ...joinResult });
  } catch (err) {
    next(err);
  }
});

// Leave meeting: marks leftAt in DB
router.post('/:id/leave', optionalAuth, async (req: Request, res: Response, next) => {
  try {
    const { participantId } = req.body;
    const leaveResult = await meetingsService.leaveMeeting(
      String(req.params.id),
      req.user?.userId,
      participantId
    );
    res.json(leaveResult);
  } catch (err) {
    next(err);
  }
});

// Get active participants
router.get('/:id/participants', optionalAuth, async (req: Request, res: Response, next) => {
  try {
    const participants = await meetingsService.getParticipants(String(req.params.id));
    res.json({ success: true, participants });
  } catch (err) {
    next(err);
  }
});

// Update meeting settings
router.patch('/:id', requireAuth, async (req: Request, res: Response, next) => {
  try {
    const meeting = await meetingsService.updateMeeting(String(req.params.id), req.user!.userId, req.body);
    res.json({ success: true, meeting });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/settings', requireAuth, async (req: Request, res: Response, next) => {
  try {
    const meeting = await meetingsService.updateMeeting(String(req.params.id), req.user!.userId, req.body);
    res.json({ success: true, meeting });
  } catch (err) {
    next(err);
  }
});

// Q&A
router.get('/:id/questions', optionalAuth, async (req: Request, res: Response, next) => {
  try {
    const questions = await meetingsService.getQuestions(String(req.params.id), req.user?.userId);
    res.json({ success: true, questions });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/questions', optionalAuth, async (req: Request, res: Response, next) => {
  try {
    let authorName = req.body.authorName || 'Guest';
    let authorAvatar = req.body.authorAvatar || null;

    if (req.user?.userId) {
      const u = await prisma.user.findUnique({ where: { id: req.user.userId } });
      if (u) {
        authorName = u.name;
        authorAvatar = u.avatar;
      }
    }

    const question = await meetingsService.createQuestion(String(req.params.id), {
      userId: req.user?.userId,
      authorName,
      authorAvatar,
      question: req.body.question,
    });
    res.status(201).json({ success: true, question });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/questions/:qId/vote', requireAuth, async (req: Request, res: Response, next) => {
  try {
    const { voteType } = req.body; // 'up' | 'down'
    const questions = await meetingsService.voteQuestion(String(req.params.qId), req.user!.userId, voteType || 'up');
    res.json({ success: true, questions });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/questions/:qId/answer', requireAuth, async (req: Request, res: Response, next) => {
  try {
    const question = await meetingsService.answerQuestion(
      String(req.params.id),
      String(req.params.qId),
      req.user!.userId,
      req.body.answer
    );
    res.json({ success: true, question });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/questions/:qId/pin', requireAuth, async (req: Request, res: Response, next) => {
  try {
    const question = await meetingsService.pinQuestion(
      String(req.params.id),
      String(req.params.qId),
      req.user!.userId,
      Boolean(req.body.isPinned)
    );
    res.json({ success: true, question });
  } catch (err) {
    next(err);
  }
});

// Comments
router.get('/:id/comments', optionalAuth, async (req: Request, res: Response, next) => {
  try {
    const comments = await meetingsService.getComments(String(req.params.id));
    res.json({ success: true, comments });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/comments', optionalAuth, async (req: Request, res: Response, next) => {
  try {
    let authorName = req.body.authorName || 'Guest';
    let authorAvatar = req.body.authorAvatar || null;

    if (req.user?.userId) {
      const u = await prisma.user.findUnique({ where: { id: req.user.userId } });
      if (u) {
        authorName = u.name;
        authorAvatar = u.avatar;
      }
    }

    const comment = await meetingsService.createComment(String(req.params.id), {
      userId: req.user?.userId,
      authorName,
      authorAvatar,
      content: req.body.content,
    });
    res.status(201).json({ success: true, comment });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id/comments/:cId', requireAuth, async (req: Request, res: Response, next) => {
  try {
    const result = await meetingsService.deleteComment(String(req.params.cId), req.user!.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Participant Report
router.post('/:id/report', optionalAuth, async (req: Request, res: Response, next) => {
  try {
    const report = await meetingsService.createReport(String(req.params.id), {
      reporterId: req.user?.userId,
      reportedUserId: req.body.reportedUserId,
      reportedName: req.body.reportedName,
      reason: req.body.reason,
      details: req.body.details,
    });
    res.status(201).json({ success: true, report });
  } catch (err) {
    next(err);
  }
});

// End meeting
router.post('/:id/end', requireAuth, async (req: Request, res: Response, next) => {
  try {
    const meeting = await meetingsService.endMeeting(String(req.params.id), req.user!.userId);
    res.json({ success: true, meeting });
  } catch (err) {
    next(err);
  }
});

// Delete meeting
router.delete('/:id', requireAuth, async (req: Request, res: Response, next) => {
  try {
    const result = await meetingsService.deleteMeeting(String(req.params.id), req.user!.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export const meetingsRouter = router;
