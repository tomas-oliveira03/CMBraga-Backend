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
        port: envs.SMTP_PORT,
        secure: false,
        auth: {
            user: envs.EMAIL_USERNAME,
            pass: envs.EMAIL_PASSWORD,
        },
    });

    await transporter.sendMail({
        from: envs.EMAIL_SENDER,
        to,
        subject,
        html,
    });
}



export async function createPasswordEmail(email: string, name: string){
    const token = generateToken( email );
    
    const link = `${envs.HOST}/api/user/set-password-redirect/${token}`;
    
    await sendEmail({
        to: email,
        subject: "Bem-vindo à MoveKids - Defina a sua palavra-passe",
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bem-vindo à MoveKids</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
                <tr>
                    <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                            <!-- Header -->
                            <tr>
                                <td style="background-color: #2E7D32; color: white; text-align: center; padding: 30px; border-radius: 8px 8px 0 0;">
                                    <h1 style="margin: 0; font-size: 50px;">🌟 MoveKids</h1>
                                    <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Câmara Municipal de Braga</p>
                                </td>
                            </tr>
                            
                            <!-- Content -->
                            <tr>
                                <td style="padding: 40px 30px;">
                                    <h2 style="color: #2E7D32; margin: 0 0 20px 0; font-size: 24px;">Bem-vindo, ${name}! 👋</h2>
                                    
                                    <p style="color: #333; line-height: 1.6; font-size: 16px; margin: 0 0 20px 0;">
                                        É com muito prazer que damos as boas-vindas à plataforma <strong>MoveKids</strong> da Câmara Municipal de Braga.
                                    </p>
                                    
                                    <p style="color: #333; line-height: 1.6; font-size: 16px; margin: 0 0 20px 0;">
                                        A sua conta foi criada com sucesso! Para começar a utilizar todos os serviços da plataforma, 
                                        precisa de definir a sua palavra-passe pessoal.
                                    </p>
                                    
                                    <p style="color: #333; line-height: 1.6; font-size: 16px; margin: 0 0 30px 0;">
                                        Clique no botão abaixo para definir a sua palavra-passe de forma segura:
                                    </p>
                                    
                                    <!-- Button -->
                                    <div style="text-align: center; margin: 30px 0;">
                                        <a href="${link}" style="background-color: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block; transition: background-color 0.3s;">
                                            🔐 Definir Palavra-passe
                                        </a>
                                    </div>
                                    
                                    <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 15px; margin: 20px 0;">
                                        <p style="color: #856404; margin: 0; font-size: 14px;">
                                            <strong>⚠️ Importante:</strong> Este link é válido por <strong>24 horas</strong>. 
                                            Por motivos de segurança, se não utilizar o link dentro deste prazo, 
                                            terá de solicitar um novo.
                                        </p>
                                    </div>
                                    
                                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                                </td>
                            </tr>
                            
                            <!-- Footer -->
                            <tr>
                                <td style="background-color: #f8f9fa; text-align: center; padding: 20px; border-radius: 0 0 8px 8px; border-top: 1px solid #eee;">
                                    <p style="color: #666; font-size: 14px; margin: 0 0 10px 0;">
                                        Este email foi enviado pela <strong>Câmara Municipal de Braga</strong>
                                    </p>
                                    <p style="color: #999; font-size: 12px; margin: 0;">
                                        Se não solicitou esta conta, pode ignorar este email.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        `
    });
}




export async function resetPasswordEmail(email: string, name: string){
    const token = generateToken( email );
    
    const link = `${envs.HOST}/api/user/set-password-redirect/${token}`;
    
    await sendEmail({
        to: email,
        subject: "MoveKids - Redefinição de Palavra-passe",
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Redefinição de Palavra-passe - MoveKids</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
                <tr>
                    <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                            <!-- Header -->
                            <tr>
                                <td style="background-color: #2E7D32; color: white; text-align: center; padding: 30px; border-radius: 8px 8px 0 0;">
                                    <h1 style="margin: 0; font-size: 50px;">🔒 MoveKids</h1>
                                    <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Câmara Municipal de Braga</p>
                                </td>
                            </tr>
                            
                            <!-- Content -->
                            <tr>
                                <td style="padding: 40px 30px;">
                                    <h2 style="color: #2E7D32; margin: 0 0 20px 0; font-size: 24px;">Olá, ${name}! 🔐</h2>
                                    
                                    <p style="color: #333; line-height: 1.6; font-size: 16px; margin: 0 0 20px 0;">
                                        Recebemos um pedido para <strong>redefinir a sua palavra-passe</strong> da plataforma MoveKids.
                                    </p>
                                    
                                    <p style="color: #333; line-height: 1.6; font-size: 16px; margin: 0 0 20px 0;">
                                        Se foi você quem fez este pedido, clique no botão abaixo para criar uma nova palavra-passe segura:
                                    </p>
                                    
                                    <!-- Button -->
                                    <div style="text-align: center; margin: 30px 0;">
                                        <a href="${link}" style="background-color: #FF6B35; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block; transition: background-color 0.3s;">
                                            🔑 Redefinir Palavra-passe
                                        </a>
                                    </div>
                                    
                                    <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 15px; margin: 20px 0;">
                                        <p style="color: #856404; margin: 0; font-size: 14px;">
                                            <strong>⚠️ Importante:</strong> Este link é válido por <strong>24 horas</strong>. 
                                            Por motivos de segurança, se não utilizar o link dentro deste prazo, 
                                            terá de solicitar um novo.
                                        </p>
                                    </div>
                                    
                                    <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; padding: 15px; margin: 20px 0;">
                                        <p style="color: #721c24; margin: 0; font-size: 14px;">
                                            <strong>🚨 Não foi você?</strong> Se não solicitou esta redefinição, 
                                            ignore este email. A sua conta permanece segura e nenhuma alteração será feita.
                                        </p>
                                    </div>
                                    
                                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

                                </td>
                            </tr>
                            
                            <!-- Footer -->
                            <tr>
                                <td style="background-color: #f8f9fa; text-align: center; padding: 20px; border-radius: 0 0 8px 8px; border-top: 1px solid #eee;">
                                    <p style="color: #666; font-size: 14px; margin: 0 0 10px 0;">
                                        Este email foi enviado pela <strong>Câmara Municipal de Braga</strong>
                                    </p>
                                    <p style="color: #999; font-size: 12px; margin: 0;">
                                        Por motivos de segurança, não partilhe este link com terceiros.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        `
    });
}