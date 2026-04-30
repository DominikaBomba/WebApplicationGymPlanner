import { Router } from 'express';
import { getUserStats } from '../controllers/stats.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
router.get('/summary', authenticate, getUserStats);
export default router;