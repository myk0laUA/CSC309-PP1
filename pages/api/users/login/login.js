import bcrypt from 'bcrypt';

import jwt from 'jsonwebtoken';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    if (req.method == 'POST') {

        const { username, password } = req.body;

        // Generated by ChatGPT
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        const existingUser = await prisma.user.findUnique({
            where: { username },

        });

        if (!existingUser) {
            return res.status(401).json({ message: 'Invalid credentials'});

        }

        const isPasswordValid = await bcrypt.compare(password, existingUser.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const payload = {
            id: existingUser.id,
            username: existingUser.username,
            role: existingUser.role,
            expiresAt: Date.now() + process.env.ACCESS_TOKEN_EXPIRES_IN,
        }

        const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN, { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN });

        const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN, { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN });

        return res.status(200).json({
            accessToken,
            refreshToken,
        });

    } else {
        res.status(405).json({ message: "Method not allowed" });
    
    }
  
}