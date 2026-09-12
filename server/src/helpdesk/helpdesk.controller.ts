import { Router, Request, Response } from 'express';
import { helpdeskService } from './helpdesk.service';
import { optionalAuth, requireAuth } from '../common/auth.middleware';

const router = Router();

// Submit ticket (public or authenticated)
router.post('/tickets', optionalAuth, async (req: Request, res: Response, next) => {
  try {
    const { name, email, phone, category, subject, message, priority } = req.body;
    const ticket = await helpdeskService.createTicket({
      name,
      email,
      phone,
      category,
      subject,
      message,
      priority,
      userId: req.user?.userId,
    });

    res.status(201).json({
      success: true,
      message: 'Support ticket submitted successfully. Our team has been notified.',
      ticket,
    });
  } catch (err) {
    next(err);
  }
});

// List user's tickets
router.get('/tickets', requireAuth, async (req: Request, res: Response, next) => {
  try {
    const tickets = await helpdeskService.getTickets(req.user?.userId);
    res.json({ success: true, tickets });
  } catch (err) {
    next(err);
  }
});

// Track ticket by reference code
router.get('/tickets/:referenceCode', async (req: Request, res: Response, next) => {
  try {
    const ticket = await helpdeskService.getTicketByReference(String(req.params.referenceCode));
    res.json({ success: true, ticket });
  } catch (err) {
    next(err);
  }
});

export const helpdeskRouter = router;
