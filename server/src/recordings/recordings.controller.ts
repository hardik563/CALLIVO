import { Router, Request, Response } from 'express';
import { recordingsService } from './recordings.service';
import { requireAuth } from '../common/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/', async (req: Request, res: Response, next) => {
  try {
    const recordings = await recordingsService.getUserRecordings(req.user!.userId);
    res.json({ success: true, recordings });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req: Request, res: Response, next) => {
  try {
    const recording = await recordingsService.createRecording(req.user!.userId, req.body);
    res.status(201).json({ success: true, recording });
  } catch (err) {
    next(err);
  }
});

router.post('/upload', async (req: Request, res: Response, next) => {
  try {
    const recording = await recordingsService.saveUploadedRecording(req.user!.userId, req.body);
    res.status(201).json({ success: true, recording });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req: Request, res: Response, next) => {
  try {
    const result = await recordingsService.deleteRecording(req.user!.userId, String(req.params.id));
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export const recordingsRouter = router;
