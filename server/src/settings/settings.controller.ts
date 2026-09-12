import { Router, Request, Response } from 'express';
import { settingsService } from './settings.service';
import { requireAuth } from '../common/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/', async (req: Request, res: Response, next) => {
  try {
    const settings = await settingsService.getSettings(req.user!.userId);
    res.json({ success: true, settings });
  } catch (err) {
    next(err);
  }
});

router.patch('/', async (req: Request, res: Response, next) => {
  try {
    const settings = await settingsService.updateSettings(req.user!.userId, req.body);
    res.json({ success: true, settings });
  } catch (err) {
    next(err);
  }
});

export const settingsRouter = router;
