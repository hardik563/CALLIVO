import { Resend } from 'resend';
import { config } from '../config';

class EmailService {
  private resend: Resend | null = null;

  constructor() {
    if (config.resend.apiKey) {
      try {
        this.resend = new Resend(config.resend.apiKey);
      } catch (err) {
        console.error('Failed to initialize Resend client:', err);
      }
    }
  }

  /**
   * Dispatches helpdesk ticket to support email (hardikdhamija676@gmail.com)
   * and sends confirmation to user.
   */
  async sendHelpdeskTicketNotification(ticket: {
    referenceCode: string;
    name: string;
    email: string;
    phone?: string;
    category: string;
    subject: string;
    message: string;
    priority: string;
  }) {
    // 1. Send notification to Hardik Dhamija (Support Admin)
    try {
      if (this.resend) {
        await this.resend.emails.send({
          from: config.resend.emailFrom,
          to: config.resend.supportEmail,
          subject: `[CALLIVO Support] ${ticket.category}: ${ticket.subject} (${ticket.referenceCode})`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #15191F; color: #f8fafc; padding: 24px; border-radius: 12px; border: 1px solid #242A33;">
              <h2 style="color: #10B981; margin-top: 0;">New CALLIVO Helpdesk Ticket</h2>
              <p style="font-size: 14px; color: #94a3b8;">A new support inquiry has been submitted through the CALLIVO Help Center.</p>
              
              <div style="background: #101318; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #242A33;">
                <p style="margin: 6px 0; font-size: 13px;"><strong>Ticket Reference:</strong> <span style="font-family: monospace; color: #34D399;">${ticket.referenceCode}</span></p>
                <p style="margin: 6px 0; font-size: 13px;"><strong>User Name:</strong> ${ticket.name}</p>
                <p style="margin: 6px 0; font-size: 13px;"><strong>Email:</strong> <a href="mailto:${ticket.email}" style="color: #10B981;">${ticket.email}</a></p>
                <p style="margin: 6px 0; font-size: 13px;"><strong>Phone:</strong> ${ticket.phone || 'N/A'}</p>
                <p style="margin: 6px 0; font-size: 13px;"><strong>Category:</strong> ${ticket.category}</p>
                <p style="margin: 6px 0; font-size: 13px;"><strong>Priority:</strong> <span style="text-transform: uppercase; color: ${ticket.priority === 'urgent' ? '#f43f5e' : '#fbbf24'}; font-weight: bold;">${ticket.priority}</span></p>
              </div>

              <h3 style="color: #ffffff; font-size: 15px; margin-bottom: 8px;">Subject: ${ticket.subject}</h3>
              <div style="background: #101318; padding: 16px; border-radius: 8px; font-size: 14px; line-height: 1.6; color: #cbd5e1; border: 1px solid #242A33; white-space: pre-wrap;">
                ${ticket.message}
              </div>

              <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #242A33; font-size: 12px; color: #64748b;">
                CALLIVO Support Operations • Admin Direct Dispatch • Hardik Dhamija (+91 7395007338)
              </div>
            </div>
          `,
        });
      }
    } catch (err) {
      console.error('Failed to send admin helpdesk email via Resend:', err);
    }

    // 2. Send confirmation receipt to user
    try {
      if (this.resend && ticket.email) {
        await this.resend.emails.send({
          from: config.resend.emailFrom,
          to: ticket.email,
          subject: `We've received your request [${ticket.referenceCode}] — CALLIVO Support`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0B0D10; color: #f8fafc; padding: 24px; border-radius: 12px; border: 1px solid #242A33;">
              <h2 style="color: #10B981; margin-top: 0;">CALLIVO Support Request Received</h2>
              <p style="font-size: 14px; color: #cbd5e1;">Hi ${ticket.name},</p>
              <p style="font-size: 14px; color: #94a3b8; line-height: 1.6;">
                Thank you for contacting CALLIVO. We've logged your request under reference 
                <strong style="color: #34D399; font-family: monospace;">${ticket.referenceCode}</strong>.
                Our engineering and support team led by Hardik Dhamija is reviewing your inquiry.
              </p>

              <div style="background: #15191F; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #242A33;">
                <p style="margin: 4px 0; font-size: 13px;"><strong>Subject:</strong> ${ticket.subject}</p>
                <p style="margin: 4px 0; font-size: 13px;"><strong>Category:</strong> ${ticket.category}</p>
                <p style="margin: 4px 0; font-size: 13px;"><strong>Status:</strong> <span style="color: #10B981; font-weight: bold;">Open</span></p>
              </div>

              <p style="font-size: 13px; color: #94a3b8;">
                If you need urgent assistance, you may reach our direct support line at <a href="tel:+917395007338" style="color: #10B981;">+91 7395007338</a>.
              </p>

              <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #242A33; font-size: 11px; color: #64748b;">
                © ${new Date().getFullYear()} CALLIVO Inc. • Meet. Connect. Collaborate.
              </div>
            </div>
          `,
        });
      }
    } catch (err) {
      console.error('Failed to send user confirmation email via Resend:', err);
    }
  }

  /**
   * Password reset email
   */
  async sendPasswordResetEmail(email: string, token: string) {
    if (!this.resend) return;
    const resetUrl = `${config.clientUrl}/reset-password?token=${token}`;
    try {
      await this.resend.emails.send({
        from: config.resend.emailFrom,
        to: email,
        subject: 'Reset your CALLIVO password',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background: #0B0D10; color: #f8fafc;">
            <h2>Password Reset Request</h2>
            <p>You requested a password reset for your CALLIVO account. Click the button below to choose a new password:</p>
            <p><a href="${resetUrl}" style="background: #10B981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a></p>
            <p style="font-size: 12px; color: #94a3b8;">This link will expire in 1 hour.</p>
          </div>
        `,
      });
    } catch (err) {
      console.error('Failed to send password reset email:', err);
    }
  }

  /**
   * Meeting Invitation Email
   */
  async sendMeetingInvitation(toEmail: string, meeting: { id: string; title: string; hostName: string; scheduledAt?: Date | null }) {
    if (!this.resend) return;
    const meetingUrl = `${config.clientUrl}/meetings/${meeting.id}/lobby`;
    try {
      await this.resend.emails.send({
        from: config.resend.emailFrom,
        to: toEmail,
        subject: `Invitation: ${meeting.title} on CALLIVO`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background: #0B0D10; color: #f8fafc;">
            <h2>You're invited to a CALLIVO Meeting</h2>
            <p><strong>${meeting.hostName}</strong> has invited you to join <strong>${meeting.title}</strong>.</p>
            <p><a href="${meetingUrl}" style="background: #10B981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">Join Meeting</a></p>
            <p style="font-size: 12px; color: #94a3b8;">Meeting ID: ${meeting.id}</p>
          </div>
        `,
      });
    } catch (err) {
      console.error('Failed to send meeting invitation email:', err);
    }
  }
}

export const emailService = new EmailService();
