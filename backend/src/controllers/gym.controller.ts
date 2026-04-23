import { Request, Response } from 'express';
import {prisma} from "../db/prisma";

export const getAllGyms = async (req: Request, res: Response) => {
    try{
        const gyms = await prisma.gym.findMany();
        return res.status(200).json(gyms);
    } catch (error) {
        console.error('Error fetching Gyms', error);
        return res.status(500).json({error: 'Internal server error while fetching gyms.'});
    }
}
