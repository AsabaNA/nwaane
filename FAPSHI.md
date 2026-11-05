# Going live with Fapshi

Schools pay their Meridian invoices through Fapshi (MTN Mobile Money and Orange Money). The platform never touches the schools' own fee money.

1. Create a Fapshi account and a **service**. In the dashboard copy the sandbox **API user** and **API key**.
2. Set the secrets (never put them in files or git). Locally, in `.env`; on Cloudflare:
   ```
   npx wrangler secret put FAPSHI_API_USER
   npx wrangler secret put FAPSHI_API_KEY
   npx wrangler secret put FAPSHI_WEBHOOK_SECRET   # any long random text; also paste it in the Fapshi dashboard
   ```
3. In the Fapshi dashboard set the service **webhook URL** to `https://YOUR-DOMAIN/api/fapshi/webhook` and the same webhook secret.
4. Test in sandbox (default). Use the success numbers from Fapshi's docs, e.g. MTN 670000000 / Orange 690000000. Schools see a "Test mode" label.
5. When ready, create the **live** service, replace the three secrets with the live values and set the variable `FAPSHI_LIVE=1`. Optionally set `PUBLIC_URL` to your site address.

How it stays safe: a payment is recorded only after the server asks Fapshi for the status and the amount matches; the same payment can never be recorded twice; the webhook secret is checked; the Owners console > Payments tab lists every attempt. Fapshi keeps 3% of each payment; the platform absorbs it.
