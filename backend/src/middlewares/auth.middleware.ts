import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Request interface to include user data
export interface AuthRequest extends Request {
    user?: {
        userId: string;
        login: string;
    };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
    // 1. Get token from Authorization header (format: Bearer <token>)
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        // 2. Verify token
        const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key';
        const decoded = jwt.verify(token, jwtSecret) as { userId: string; login: string };

        // 3. Add user info to request object
        req.user = decoded;

        return next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token.' });
    }
};