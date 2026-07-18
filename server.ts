import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Example: POST /api/notify
// Body: { type: 'sms' | 'email', to: string, message: string }
app.post("/api/notify", async (req, res) => {
  const { type, to, message } = req.body;

  try {
    if (type === "sms") {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromPhone = process.env.TWILIO_PHONE_NUMBER;

      if (!accountSid || !authToken || !fromPhone) {
         return res.json({ 
           success: true, 
           simulated: true, 
           type: "sms", 
           to, 
           message,
           info: "Pour de vrais envois de SMS, configurez les variables d'environnement TWILIO_* (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER) dans les Secrets des paramètres de Google AI Studio (bouton engrenage)." 
         });
      }
      
      const twilioClient = twilio(accountSid, authToken);
      const twilioRes = await twilioClient.messages.create({
        body: message,
        from: fromPhone,
        to,
      });
      return res.json({ success: true, id: twilioRes.sid });
    } else if (type === "email") {
      const host = process.env.SMTP_HOST;
      const port = process.env.SMTP_PORT || "587";
      const secure = process.env.SMTP_SECURE === "true";
      const user = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASS;

      if (!host || !user || !pass) {
        return res.json({
          success: true,
          simulated: true,
          type: "email",
          to,
          message,
          info: "Pour de vrais envois d'emails, configurez les variables d'environnement SMTP_* (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS) dans les Secrets des paramètres de Google AI Studio (bouton engrenage)."
        });
      }

      const transporter = nodemailer.createTransport({
        host: host,
        port: parseInt(port),
        secure: secure,
        auth: {
          user: user,
          pass: pass,
        },
      });
      
      const mailRes = await transporter.sendMail({
        from: `"PlanMasterGO" <${user}>`,
        to,
        subject: "Rappel PlanMasterGO",
        text: message,
      });
      return res.json({ success: true, id: mailRes.messageId });
    } else {
      return res.status(400).json({ error: "Type de notification invalide." });
    }
  } catch (error: any) {
    console.error("Erreur d'envoi:", error);
    return res.status(500).json({ error: error.message || "Erreur inconnue." });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
