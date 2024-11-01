import { PrismaClient } from '@prisma/client';

import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export default async function handler(req, res) {

    if (req.method === "POST") {
        
        const { username, firstName, lastName, email, password, avatar, phoneNum, role } = req.body;

        if (!username || !firstName || !lastName || !email || !password || !phoneNum) {
            return res.status(400).json({ error: 'All fields required'});
        }

        const existingUser = await prisma.user.findUnique({
            where: { username },
        });

        if (existingUser) {
            return res.status(400).json({ error: 'User already exists'});

        }

        if (role && role !== "USER" && role !== "ADMIN") {
            return res.status(400).json({ error: 'Invalid role'});
        }

        // generated by ChatGPT
        const existingEmail = await prisma.user.findUnique({
            where: { email },
        });
        if (existingEmail) {
            return res.status(400).json({ error: 'Email already exists' });
        }
        const existingPhoneNumber = await prisma.user.findUnique({
            where: { phoneNum },
        });
        if (existingPhoneNumber) {
            return res.status(400).json({ error: 'Phone number already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                username,
                firstName,
                lastName,
                email,
                password: hashedPassword,
                avatar,
                phoneNum,
                role,
            }
        })

        return res.status(201).json(user);


    } else {
        res.status(405).json({ message: "Method not allowed" });
    
    }

}