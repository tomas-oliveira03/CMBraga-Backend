import { envs } from "@/config";
import jwt, { Secret, SignOptions } from "jsonwebtoken";
import nodemailer from "nodemailer";

export function generateToken(userEmail: string): string {
    return jwt.sign({userEmail}, envs.JWT_SECRET, {
        expiresIn: "24h"
    });
}

export function verifyToken(token: string): any {
    return jwt.verify(token, envs.JWT_SECRET);
}


export async function sendEmail({ to, subject, html }: { to: string, subject: string, html: string }) {
  const transporter = nodemailer.createTransport({
	host: envs.SMTP_SERVER,
	port: Number(envs.SMTP_PORT),
	secure: false,
	auth: {
	  user: envs.GMAIL_USERNAME,
	  pass: envs.GMAIL_PASSWORD_SMTP,
	},
  } as any);

  await transporter.sendMail({
    to,
    subject,
    html,
  });
}



export async function sendPasswordReset(email: string, name: string){
    const token = generateToken( email );
    
    const link = `${envs.BASE_URL}/api/auth/register/set-password?token=${token}`;
    
    await sendEmail({
        to: email,
        subject: "Defina a sua palavra-passe",
        html: `
        <p>Olá ${name},</p>
        <p>Foi registado como instrutor na nossa plataforma.</p>
        <p>Clique no link abaixo para definir a sua palavra-passe:</p>
        <a href="${link}">${link}</a>
        <p>Este link é válido por 24 horas.</p>
        `
    });

}


