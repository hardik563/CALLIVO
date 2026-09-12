import { Router, Request, Response } from 'express';
import { contactsService } from './contacts.service';
import { requireAuth } from '../common/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/', async (req: Request, res: Response, next) => {
  try {
    const contacts = await contactsService.getContacts(req.user!.userId);
    res.json({ success: true, contacts });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req: Request, res: Response, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    const contact = await contactsService.addContactByEmail(req.user!.userId, email);
    res.status(201).json({ success: true, contact });
  } catch (err) {
    next(err);
  }
});

router.patch('/:contactId/favorite', async (req: Request, res: Response, next) => {
  try {
    const updated = await contactsService.toggleFavorite(req.user!.userId, String(req.params.contactId));
    res.json({ success: true, contact: updated });
  } catch (err) {
    next(err);
  }
});

router.delete('/:contactId', async (req: Request, res: Response, next) => {
  try {
    const result = await contactsService.removeContact(req.user!.userId, String(req.params.contactId));
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export const contactsRouter = router;
