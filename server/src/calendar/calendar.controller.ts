import { Router, Request, Response } from 'express';
import { calendarService } from './calendar.service';
import { requireAuth } from '../common/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/', async (req: Request, res: Response, next) => {
  try {
    const month = req.query.month as string | undefined;
    const events = await calendarService.getEvents(req.user!.userId, month);
    res.json({ success: true, events });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req: Request, res: Response, next) => {
  try {
    const event = await calendarService.createEvent(req.user!.userId, req.body);
    res.status(201).json({ success: true, event });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req: Request, res: Response, next) => {
  try {
    const event = await calendarService.updateEvent(req.user!.userId, String(req.params.id), req.body);
    res.json({ success: true, event });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req: Request, res: Response, next) => {
  try {
    const result = await calendarService.deleteEvent(req.user!.userId, String(req.params.id));
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export const calendarRouter = router;
