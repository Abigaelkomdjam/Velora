// supabase/functions/send_receipt/index.ts
import { serve } from 'https://deno.land/std@0.178.0/http/server.ts';
import { SmtpClient, SmtpClientConfig } from 'https://deno.land/x/smtp@0.8.0/mod.ts';

serve(async (req) => {
  try {
    const { order_id, email, pdf_base64 } = await req.json();

    // Convertir base64 en Uint8Array
    const pdfBytes = Uint8Array.from(atob(pdf_base64), c => c.charCodeAt(0));

    // Config Mailgun (en récupérant les ENV vars)
    const config: SmtpClientConfig = {
      hostname: Deno.env.get('SMTP_HOST')!,         // ex. "smtp.mailgun.org"
      port: Number(Deno.env.get('SMTP_PORT')),      // 587
      username: Deno.env.get('SMTP_USER')!,         // postmaster@...
      password: Deno.env.get('SMTP_PASS')!,
      tls: { // Mailgun recommande STARTTLS sur 587
        startTls: true,
      },
    };

    const client = new SmtpClient();
    await client.connect(config);

    // Préparer et envoyer le mail
    await client.send({
      from: Deno.env.get('SMTP_FROM')!,             // ex. "Velora <no‑reply@...>"
      to: email,
      subject: `Reçu de votre commande #${order_id}`,
      content: `Bonjour,\n\nVeuillez trouver en pièce jointe le reçu de votre commande #${order_id}.\n\nMerci pour votre confiance !`,
      // Attach PDF
      // deno-smtp n'a pas d'API native pour attachments, on encode en base64 inline :
      attachments: [
        {
          filename: `recu_${order_id}.pdf`,
          contentType: 'application/pdf',
          content: pdfBytes.buffer,
        },
      ],
    });

    await client.close();
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error('send_receipt error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
