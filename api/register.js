const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://rfmbhdgfovnglegqxjnj.supabase.co',
  process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmbWJoZGdmb3ZuZ2xlZ3F4am5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTc0NDg3MiwiZXhwIjoyMDc1MzIwODcyfQ.cxYG4xpMubBsetGB1e6wWLcd_IX-Bwtjpvgj-1ImzMw'
);

function getMailTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;
  if (!user || !pass) return null;
  return nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
}

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Safety: ensure body is parsed (Vercel auto-parses, Express needs middleware)
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});

    const {
      firstName,
      lastName,
      email,
      password,
      street,
      houseNumber,
      postalCode,
      city,
      phone,
      birthDate
    } = body;

    // ── Input validation ──────────────────────────────────────────────
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vul alle verplichte velden in (naam, email, wachtwoord).'
      });
    }

    if (!email.includes('@') || !email.includes('.')) {
      return res.status(400).json({
        success: false,
        message: 'Ongeldig emailadres.'
      });
    }

    // ── Check for existing account first ──────────────────────────────
    const { data: existing } = await supabase
      .from('customers')
      .select('id, email_verified')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (existing) {
      if (!existing.email_verified) {
        // Unverified account exists — generate a new code and let them verify
        const newCode = Math.floor(100000 + Math.random() * 900000).toString();
        const newExpiry = new Date(Date.now() + 15 * 60 * 1000).toISOString();

        await supabase
          .from('customers')
          .update({
            verification_code: newCode,
            verification_code_expires_at: newExpiry,
          })
          .eq('id', existing.id);

        // Try to send new code
        const transporter = getMailTransporter();
        if (transporter) {
          try {
            await transporter.sendMail({
              from: process.env.EMAIL_USER,
              to: email,
              subject: 'Nieuwe verificatiecode - PIGG',
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #28EBCF;">Nieuwe verificatiecode</h2>
                  <p>Je hebt opnieuw geprobeerd te registreren. Gebruik deze code om je email te bevestigen:</p>
                  <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                    <h1 style="color: #1A1B1F; font-size: 36px; letter-spacing: 8px; margin: 0;">${newCode}</h1>
                  </div>
                  <p>Deze code is <strong>15 minuten geldig</strong>.</p>
                </div>
              `
            });
          } catch (emailErr) {
            console.error('Error sending re-verification email:', emailErr.message);
          }
        }

        return res.status(200).json({
          success: true,
          message: 'Er bestaat al een account met dit emailadres. We hebben een nieuwe verificatiecode gestuurd.',
          requiresVerification: true,
          email: email,
        });
      }

      // Already verified
      return res.status(400).json({
        success: false,
        message: 'Dit emailadres is al geregistreerd. Probeer in te loggen.'
      });
    }

    // ── Create new account ────────────────────────────────────────────
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const customerData = {
      first_name: firstName,
      last_name: lastName,
      email: email.toLowerCase().trim(),
      password: password,
      street: street || null,
      house_number: houseNumber || null,
      postal_code: postalCode || null,
      city: city || null,
      phone: phone || null,
      role: 'customer',
      account_type: 'fictief',
      email_verified: false,
      verification_code: verificationCode,
      verification_code_expires_at: codeExpiresAt,
    };

    if (birthDate) {
      customerData.birth_date = birthDate;
    }

    const { data: customer, error } = await supabase
      .from('customers')
      .insert([customerData])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error.code, error.message);
      const isDuplicate = error.message && error.message.includes('duplicate');
      return res.status(400).json({
        success: false,
        message: isDuplicate
          ? 'Dit emailadres is al geregistreerd.'
          : `Registratie mislukt: ${error.message || 'database fout'}`
      });
    }

    // ── Send verification email ───────────────────────────────────────
    const transporter = getMailTransporter();
    if (transporter) {
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Bevestig je emailadres - PIGG',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #28EBCF;">Welkom bij PIGG!</h2>
              <p>Hallo ${firstName},</p>
              <p>Bedankt voor je registratie! Gebruik de onderstaande code om je emailadres te bevestigen:</p>
              <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                <h1 style="color: #1A1B1F; font-size: 36px; letter-spacing: 8px; margin: 0;">${verificationCode}</h1>
              </div>
              <p>Deze code is <strong>15 minuten geldig</strong>.</p>
              <p>Als je deze registratie niet hebt aangevraagd, kun je deze email negeren.</p>
              <p>Met vriendelijke groet,<br>Het PIGG Team</p>
            </div>
          `
        });
      } catch (emailError) {
        console.error('Error sending verification email:', emailError.message);
      }

      // Admin notification (best effort)
      try {
        if (process.env.NOTIFICATION_EMAIL) {
          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.NOTIFICATION_EMAIL,
            subject: 'New User Registration - PIGG',
            html: `
              <h2>New User Registration</h2>
              <p><strong>Name:</strong> ${firstName} ${lastName}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Registration Date:</strong> ${new Date().toLocaleString('nl-NL')}</p>
            `
          });
        }
      } catch (_) { /* ignore */ }
    }

    // ── Auto-create virtual account so user appears in admin cash allocation ──
    try {
      await supabase
        .from('virtual_accounts')
        .insert([{
          owner_id: customer.id,
          name: 'Portfolio',
          description: 'Default trading portfolio',
          is_active: true,
        }]);
    } catch (vaError) {
      console.error('Error creating virtual account:', vaError.message);
      // Non-fatal: user can still register, account will be created lazily later
    }

    res.status(200).json({
      success: true,
      message: 'Registratie succesvol! Check je email voor de verificatiecode.',
      emailSent: !!transporter,
      email: email,
      requiresVerification: true
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: `Registratie mislukt: ${error.message || 'onbekende fout'}`
    });
  }
};
