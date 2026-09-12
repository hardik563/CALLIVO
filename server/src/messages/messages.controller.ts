import { Router, Request, Response } from 'express';
import { messagesService } from './messages.service';
import { requireAuth } from '../common/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/conversations', async (req: Request, res: Response, next) => {
  try {
    const conversations = await messagesService.getConversations(req.user!.userId);
    res.json({ success: true, conversations });
  } catch (err) {
    next(err);
  }
});

router.get('/:partnerId', async (req: Request, res: Response, next) => {
  try {
    const messages = await messagesService.getMessages(req.user!.userId, String(req.params.partnerId));
    res.json({ success: true, messages });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req: Request, res: Response, next) => {
  try {
    const { recipientId, content } = req.body;
    if (!recipientId || !content) {
      return res.status(400).json({ success: false, message: 'recipientId and content are required' });
    }
    const message = await messagesService.sendMessage(req.user!.userId, recipientId, content);
    res.status(201).json({ success: true, message });
  } catch (err) {
    next(err);
  }
});

export const messagesRouter = router;
