import nodemailer from 'nodemailer'

async function getTransporter() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT ?? '587'),
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  }
  // Local dev: use Ethereal fake SMTP — preview URL logged to console
  const testAccount = await nodemailer.createTestAccount()
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: { user: testAccount.user, pass: testAccount.pass },
  })
}

export async function sendOTPEmail(to: string, otp: string): Promise<void> {
  const transporter = await getTransporter()
  const info = await transporter.sendMail({
    from: '"Budget App" <noreply@budget.app>',
    to,
    subject: 'Your password reset code',
    text: `Your 6-digit reset code is: ${otp}\n\nThis code expires in 15 minutes.`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 400px; margin: 0 auto; padding: 40px 20px;">
        <p style="font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #999;">Budget App</p>
        <h2 style="font-size: 24px; font-weight: 300; color: #111; margin: 24px 0 8px;">Reset your password</h2>
        <p style="color: #666; font-size: 14px; font-weight: 300;">Enter this code to reset your password:</p>
        <p style="font-size: 36px; font-weight: 300; letter-spacing: 0.3em; color: #111; margin: 32px 0;">${otp}</p>
        <p style="color: #999; font-size: 12px;">Expires in 15 minutes. If you didn't request this, ignore this email.</p>
      </div>
    `,
  })

  const previewUrl = nodemailer.getTestMessageUrl(info)
  if (previewUrl) {
    console.log('\n📧 Password reset email preview:', previewUrl, '\n')
  }
}
