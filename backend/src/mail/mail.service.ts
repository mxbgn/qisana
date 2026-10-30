import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private resend = new Resend(process.env.RESEND_API_KEY);

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const baseUrl = process.env.FRONTEND_URL || 'https://pro.secours-infirmiers.fr';
    const url = `${baseUrl}/verify-email?token=${token}`;

    try {
      const { data, error } = await this.resend.emails.send({
        from: 'Qisana <no-reply@pro.secours-infirmiers.fr>',
        to: email,
        subject: 'Activer votre compte Qisana',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
              .wrapper { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
              .header { background-color: #2563eb; padding: 32px; text-align: center; }
              .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em; }
              .content { padding: 40px; color: #334155; line-height: 1.6; }
              .content h2 { color: #1e293b; font-size: 20px; font-weight: 700; margin-top: 0; }
              .content p { font-size: 16px; margin-bottom: 24px; color: #64748b; }
              .btn-container { text-align: center; margin: 32px 0; }
              .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; font-weight: 700; font-size: 16px; padding: 14px 32px; text-decoration: none; border-radius: 10px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2); }
              .footer { background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0; }
              .footer p { font-size: 13px; color: #94a3b8; margin: 0; }
              .link-fallback { word-break: break-all; font-size: 13px; color: #94a3b8; background-color: #f1f5f9; padding: 12px; border-radius: 8px; margin-top: 24px; }
            </style>
          </head>
          <body>
            <div class="wrapper">
              <div class="header">
                <h1>Qisana</h1>
              </div>
              <div class="content">
                <h2>Bienvenue sur le Portail de Coordination</h2>
                <p>Merci pour votre inscription. Pour finaliser la création de votre compte et accéder à la plateforme, merci de confirmer votre adresse e-mail en cliquant sur le bouton ci-dessous :</p>
                <div class="btn-container">
                  <a href="${url}" class="btn">Confirmer mon adresse email</a>
                </div>
                <p>Ce lien expirera automatiquement pour des raisons de sécurité. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail en toute sécurité.</p>
                <div class="link-fallback">
                  <strong>Lien alternatif :</strong><br>${url}
                </div>
              </div>
              <div class="footer">
                <p>&copy; 2026 Qisana. Tous droits réservés.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      if (error) {
        console.error('Resend Error:', error);
        throw new InternalServerErrorException("Échec de l'envoi de l'e-mail de validation.");
      }
    } catch (error) {
      console.error('Mail Service Exception:', error);
      throw new InternalServerErrorException("Échec de l'envoi de l'e-mail de validation.");
    }
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const baseUrl = process.env.FRONTEND_URL || 'https://pro.secours-infirmiers.fr';
    const url = `${baseUrl}/reset-password?token=${token}`;

    try {
      const { data, error } = await this.resend.emails.send({
        from: 'Qisana <no-reply@pro.secours-infirmiers.fr>',
        to: email,
        subject: 'Réinitialisation de votre mot de passe - Qisana',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
              .wrapper { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
              .header { background-color: #2563eb; padding: 32px; text-align: center; }
              .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em; }
              .content { padding: 40px; color: #334155; line-height: 1.6; }
              .content h2 { color: #1e293b; font-size: 20px; font-weight: 700; margin-top: 0; }
              .content p { font-size: 16px; margin-bottom: 24px; color: #64748b; }
              .btn-container { text-align: center; margin: 32px 0; }
              .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; font-weight: 700; font-size: 16px; padding: 14px 32px; text-decoration: none; border-radius: 10px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2); }
              .footer { background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0; }
              .footer p { font-size: 13px; color: #94a3b8; margin: 0; }
              .link-fallback { word-break: break-all; font-size: 13px; color: #94a3b8; background-color: #f1f5f9; padding: 12px; border-radius: 8px; margin-top: 24px; }
            </style>
          </head>
          <body>
            <div class="wrapper">
              <div class="header">
                <h1>Qisana</h1>
              </div>
              <div class="content">
                <h2>Réinitialisation de mot de passe</h2>
                <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :</p>
                <div class="btn-container">
                  <a href="${url}" class="btn">Réinitialiser mon mot de passe</a>
                </div>
                <p>Ce lien expirera dans 1 heure. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail en toute sécurité.</p>
                <div class="link-fallback">
                  <strong>Lien alternatif :</strong><br>${url}
                </div>
              </div>
              <div class="footer">
                <p>&copy; 2026 Qisana. Tous droits réservés.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      if (error) {
        console.error('Resend Error:', error);
        throw new InternalServerErrorException("Échec de l'envoi de l'e-mail de réinitialisation.");
      }
    } catch (error) {
      console.error('Mail Service Exception:', error);
      throw new InternalServerErrorException("Échec de l'envoi de l'e-mail de réinitialisation.");
    }
  }
}
