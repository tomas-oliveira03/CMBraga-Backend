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



export async function createPassword(email: string, name: string){
    const token = generateToken( email );
    
    const link = `${envs.BASE_URL}/api/auth/register/set-password?token=${token}`;
    
    await sendEmail({
        to: email,
        subject: "Defina a sua palavra-passe",
        html: `
        <p>Olá ${name},</p>
        <p>Foi registado na nossa plataforma.</p>
        <p>Clique no link abaixo para definir a sua palavra-passe:</p>
        <a href="${link}">${link}</a>
        <p>Este link é válido por 24 horas.</p>
        `
    });
}


export async function resetPassword(email: string, name: string){
    const token = generateToken( email );
    
    const link = `${envs.BASE_URL}/api/auth/register/set-password?token=${token}`;
    
    await sendEmail({
        to: email,
        subject: "Altere a sua palavra-passe",
        html: `
        <p>Olá ${name},</p>
        <p>Clique no link abaixo para alterar a sua palavra-passe:</p>
        <a href="${link}">${link}</a>
        <p>Este link é válido por 24 horas.</p>
        `
    });
}


export async function sendFeedbackReminder(
    parentEmail: string, 
    parentName: string, 
    childName: string,
    activityType: string,
    feedbackLink: string
) {
    await sendEmail({
        to: parentEmail,
        subject: `Feedback da atividade do seu filho ${childName} em falta`,
        html: `
            <p>Olá ${parentName},</p>
            <p>O seu filho <strong>${childName}</strong> participou hoje numa atividade.</p>
            <p>Agradecemos que o ${childName} preencha o questionário de feedback relativo à atividade ${activityType}.</p>
            <p>Por favor, clique no link abaixo:</p>
            <a href="${feedbackLink}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Preencher Avaliação</a>
        `
    });
}