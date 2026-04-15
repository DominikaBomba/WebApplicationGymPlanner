import { Router } from 'express';
import { createPost } from '../controllers/post.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate';
import { createPostSchema } from '../schemas/post.schema';

const router = Router();
router.post('/', authenticate, validate(createPostSchema), createPost);

export default router;