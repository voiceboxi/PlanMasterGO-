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
// Body: { type: 'sms' | 'email', to: string, message: string, smtpConfig?: object, twilioConfig?: object }
app.post("/api/notify", async (req, res) => {
  const { type, to, message, smtpConfig, twilioConfig } = req.body;

  try {
    if (type === "sms") {
      const accountSid = twilioConfig?.accountSid || process.env.TWILIO_ACCOUNT_SID;
      const authToken = twilioConfig?.authToken || process.env.TWILIO_AUTH_TOKEN;
      const fromPhone = twilioConfig?.fromPhone || process.env.TWILIO_PHONE_NUMBER;

      if (!accountSid || !authToken || !fromPhone) {
        return res.status(400).json({ 
          error: "Configuration Twilio manquante sur le serveur (.env). Veuillez renseigner TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN et TWILIO_PHONE_NUMBER dans les paramètres AI Studio." 
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
      const host = smtpConfig?.host || process.env.SMTP_HOST || "smtp.gmail.com";
      const port = smtpConfig?.port || process.env.SMTP_PORT || "587";
      const secure = smtpConfig?.secure !== undefined ? Boolean(smtpConfig.secure) : (process.env.SMTP_SECURE === "true");
      const user = smtpConfig?.user || process.env.SMTP_USER;
      const pass = smtpConfig?.pass || process.env.SMTP_PASS;

      if (!user || !pass) {
        return res.status(400).json({
          error: "Configuration SMTP manquante sur le serveur (.env). Veuillez renseigner SMTP_USER et SMTP_PASS (Mot de passe d'application Gmail) dans les paramètres AI Studio."
        });
      }

      const transporter = nodemailer.createTransport({
        host: host,
        port: parseInt(String(port)),
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
    console.error("Erreur d'envoi notification:", error);
    let userFriendlyError = error.message || "Erreur lors de l'envoi de la notification.";
    if (error.code === 'EAUTH' || error.responseCode === 535) {
      userFriendlyError = "Échec authentification Gmail : Si vous utilisez Gmail, créez un 'Mot de passe d'application' (App Password) dans compte Google > Sécurité > Validation en 2 étapes > Mots de passe d'application.";
    } else if (error.status === 401 || error.code === 20003) {
      userFriendlyError = "Échec Twilio : Account SID ou Auth Token invalide.";
    } else if (error.code === 21608 || error.code === 21211) {
      userFriendlyError = "Échec Twilio : Numéro de téléphone non valide ou non autorisé dans votre compte d'essai Twilio.";
    }
    return res.status(500).json({ error: userFriendlyError });
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
