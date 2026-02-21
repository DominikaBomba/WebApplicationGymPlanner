import { Router } from 'express';
import {loginUser, registerUser} from '../controllers/auth.controller';
import { validate } from '../middlewares/validate';
import { registerSchema, loginSchema } from '../schemas/auth.schema';

const router = Router();

//rejestracja
// walidacja w auth.schema potem przejście do kontrolera
router.post('/register', validate(registerSchema), registerUser);

//Logowanie
router.post('/login', validate(loginSchema), loginUser);

export default router;