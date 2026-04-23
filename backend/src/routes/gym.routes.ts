import { Router } from 'express';
import { getAllGyms } from '../controllers/gym.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, getAllGyms);

export default router;
