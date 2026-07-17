# PlanMaster - Notes de mise à jour

Synchronisation entre hébergeurs : J'ai ajouté un champ "Code de synchronisation" visible dans la modale des paramètres. Ce code est votre identifiant unique (deviceId). Lorsque vous changez d'hébergeur (par exemple, vers Vercel), il vous suffit de copier/coller ce code dans les paramètres de votre nouvel hébergement et d'enregistrer pour retrouver toutes vos données de calendrier et vos configurations de notification automatiquement chargées depuis Supabase !

Notifications Vercel : J'ai créé un dossier /api contenant un script Serverless officiel adapté à Vercel (notify.ts), ainsi qu'un fichier de configuration vercel.json. Désormais, lors du déploiement sur Vercel, l'envoi d'e-mails (via SMTP) et de SMS (via Twilio) fonctionnera parfaitement grâce aux routes backend de Vercel.

N'oubliez pas d'ajouter vos variables d'environnement (SMTP_HOST, TWILIO_ACCOUNT_SID, etc.) directement dans l'onglet "Settings > Environment Variables" de votre projet sur Vercel pour que l'envoi soit autorisé.
