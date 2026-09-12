import { Router, Request, Response } from 'express';
import { notificationsService } from './notifications.service';
import { requireAuth } from '../common/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/', async (req: Request, res: Response, next) => {
  try {
    const result = await notificationsService.getNotifications(req.user!.userId);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/read', async (req: Request, res: Response, next) => {
  try {
    await notificationsService.markAsRead(req.user!.userId, String(req.params.id));
    res.json({ success: true, message: 'Marked as read' });
  } catch (err) {
    next(err);
  }
});

router.patch('/read-all', async (req: Request, res: Response, next) => {
  try {
    await notificationsService.markAllAsRead(req.user!.userId);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
});

export const notificationsRouter = router;
