import type { Request, Response } from 'express';
import bcrypt from 'bcrypt'; //libka do hashowania haseł
import jwt from 'jsonwebtoken'; //libka do JSON Web Token
import { prisma } from '../db/prisma';

export const registerUser = async (req: Request, res: Response) => {
    try {
        const { login, nickname, password } = req.body;

        const existingUser = await prisma.user.findUnique({
            where: { login },
        });

        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists.' });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUser = await prisma.user.create({
            data: {
                login,
                nickname,
                password: hashedPassword,
            },
        });

        return res.status(201).json({
            message: 'Registration successfull',
            user: {
                id: newUser.id,
                login: newUser.login,
                nickname: newUser.nickname,
            },
        });
    } catch (error) {
        console.error("Registration error: ", error);
        return res.status(500).json({ error: 'Internal server error during registration.' });
    }
};

export const loginUser = async (req: Request, res: Response) => {
    try {
        const { login, password } = req.body;

        const user = await prisma.user.findUnique({
            where: { login },
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key';

        const token = jwt.sign(
            {
                userId: user.id,
                login: user.login
            }, // payload "zaszyty" w tokenie
            jwtSecret,
            { expiresIn: '24h' } // po jakim czasie wygaśnie token
        );

        return res.status(200).json({
            message: 'Login successful!',
            token: token,
            user: {
                id: user.id,
                login: user.login,
                nickname: user.nickname,
            },
        });

    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ error: 'Internal server error during login.' });
    }
};