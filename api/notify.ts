import nodemailer from "nodemailer";
import twilio from "twilio";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { type, to, message, smtpConfig, twilioConfig } = req.body;

  try {
    if (type === "sms") {
      const accountSid = twilioConfig?.accountSid || process.env.TWILIO_ACCOUNT_SID;
      const authToken = twilioConfig?.authToken || process.env.TWILIO_AUTH_TOKEN;
      const fromPhone = twilioConfig?.fromPhone || process.env.TWILIO_PHONE_NUMBER;

      if (!accountSid || !authToken || !fromPhone) {
         return res.status(200).json({ 
           success: true, 
           simulated: true, 
           type: "sms", 
           to, 
           message,
           info: "Pour de vrais envois de SMS, renseignez vos identifiants Twilio dans les Paramètres > Notifications de l'application ou en variables d'environnement." 
         });
      }
      
      const twilioClient = twilio(accountSid, authToken);
      const twilioRes = await twilioClient.messages.create({
        body: message,
        from: fromPhone,
        to,
      });
      return res.status(200).json({ success: true, id: twilioRes.sid });
    } else if (type === "email") {
      const host = smtpConfig?.host || process.env.SMTP_HOST;
      const port = smtpConfig?.port || process.env.SMTP_PORT || "587";
      const secure = smtpConfig?.secure !== undefined ? Boolean(smtpConfig.secure) : (process.env.SMTP_SECURE === "true");
      const user = smtpConfig?.user || process.env.SMTP_USER;
      const pass = smtpConfig?.pass || process.env.SMTP_PASS;

      if (!host || !user || !pass) {
        return res.status(200).json({
          success: true,
          simulated: true,
          type: "email",
          to,
          message,
          info: "Pour de vrais envois d'emails, renseignez vos paramètres SMTP (ex: Gmail, Brevo...) dans les Paramètres > Notifications de l'application ou en variables d'environnement."
        });
      }

      const nodeMailerTransporter = nodemailer.createTransport({
        host: host,
        port: parseInt(port),
        secure: secure,
        auth: {
          user: user,
          pass: pass,
        },
      });

      const mailRes = await nodeMailerTransporter.sendMail({
        from: `"PlanMasterGO" <${user}>`,
        to,
        subject: "Rappel PlanMasterGO",
        text: message,
      });
      return res.status(200).json({ success: true, id: mailRes.messageId });
    } else {
      return res.status(400).json({ error: "Type de notification invalide." });
    }
  } catch (error: any) {
    console.error("Erreur d'envoi:", error);
    return res.status(500).json({ error: error.message || "Erreur inconnue." });
  }
}
