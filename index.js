import dotenv from 'dotenv';
dotenv.config();
import express from "express";
import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";
import cors from 'cors'

const prisma = new PrismaClient();
const app = express();
app.use(express.json());
app.use(cors())

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

app.post("/api/referrals", async (req, res) => {
  try {
    const { name, email, referralCode } = req.body;

    if (!name || !email || !referralCode) {
      return res.status(400).json({ error: "All required fields must be filled." });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email format." });
    }

    const referral = await prisma.referral.create({
      data: { name, email, referralCode },
    });

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: "trachit752@gmail.com",  // admin who will check the referral code belongs to which user for now.This can easily be automated.
      subject: "New Referral Submission",
      text: `Referral Details:\n\nName: ${name}\nEmail: ${email}\nReferral Code: ${referralCode}`,
    });

    res.status(201).json({ message: "Referral submitted successfully", referral });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
