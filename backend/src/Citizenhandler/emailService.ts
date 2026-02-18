import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendIssueCreatedEmail(
  email: string,
  userName: string,
  issueData: {
    id: string;
    title: string;
    description: string;
    category: string;
    priority: string;
    status: string;
    location: string;
    createdAt: string;
  }
) {
  const getPriorityColor = (priority: string) => {
    switch (priority.toUpperCase()) {
      case "CRITICAL":
        return "#ef4444";
      case "HIGH":
        return "#f97316";
      case "MEDIUM":
        return "#eab308";
      case "LOW":
        return "#3b82f6";
      default:
        return "#71717a";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "RESOLVED":
        return "#10b981";
      case "IN_PROGRESS":
        return "#eab308";
      case "PENDING":
        return "#3b82f6";
      default:
        return "#71717a";
    }
  };

  const priorityColor = getPriorityColor(issueData.priority);
  const statusColor = getStatusColor(issueData.status);

  const info = await transporter.sendMail({
    from: `"CIVICOS" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `Issue Reported Successfully – #${issueData.id}`,
    text: `Hi ${userName}, your issue "${issueData.title}" has been successfully reported. Issue ID: ${issueData.id}. Status: ${issueData.status}. We will keep you updated on the progress.`,
    html: `
      <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: auto; background-color: #0a0a0a; border: 1px solid #27272a; border-radius: 10px; overflow: hidden;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 32px; text-align: center;">
          <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">CIVICOS</h1>
          <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px; font-weight: 500;">Civic Engagement Platform</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 32px; background-color: #0a0a0a;">
          <h2 style="color: #10b981; font-size: 20px; font-weight: 600; margin: 0 0 8px 0;">✓ Issue Reported Successfully</h2>
          <p style="font-size: 15px; color: #a1a1aa; line-height: 1.6; margin: 0 0 32px 0;">
            Hi ${userName}, your civic issue has been successfully submitted to our platform.
          </p>

          <!-- Issue Card -->
          <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 10px; padding: 24px; margin-bottom: 24px;">
            <h3 style="color: #ffffff; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">${issueData.title}</h3>
            <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0; padding-bottom: 20px; border-bottom: 1px solid #27272a;">
              ${issueData.description}
            </p>

            <!-- Issue Details Grid -->
            <div style="display: grid; gap: 16px;">
              <!-- Issue ID -->
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #71717a; font-size: 12px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Issue ID</span>
                <span style="color: #d4d4d8; font-size: 14px; font-weight: 600; font-family: 'Courier New', monospace;">#${issueData.id}</span>
              </div>

              <!-- Status -->
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #71717a; font-size: 12px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Status</span>
                <span style="color: ${statusColor}; font-size: 13px; font-weight: 600; background-color: ${statusColor}14; padding: 4px 12px; border-radius: 6px; border: 1px solid ${statusColor};">
                  ${issueData.status}
                </span>
              </div>

              <!-- Priority -->
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #71717a; font-size: 12px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Priority</span>
                <span style="color: ${priorityColor}; font-size: 13px; font-weight: 600; background-color: ${priorityColor}14; padding: 4px 12px; border-radius: 6px; border: 1px solid ${priorityColor};">
                  ${issueData.priority}
                </span>
              </div>

              <!-- Category -->
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #71717a; font-size: 12px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Category</span>
                <span style="color: #d4d4d8; font-size: 14px; font-weight: 500;">${issueData.category}</span>
              </div>

              <!-- Location -->
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #71717a; font-size: 12px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Location</span>
                <span style="color: #d4d4d8; font-size: 14px; font-weight: 500;">${issueData.location}</span>
              </div>

              <!-- Date -->
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #71717a; font-size: 12px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Reported On</span>
                <span style="color: #d4d4d8; font-size: 14px; font-weight: 500;">${new Date(issueData.createdAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              </div>
            </div>
          </div>

          <!-- Next Steps -->
          <div style="background-color: #18181b; border-left: 4px solid #3b82f6; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
            <h4 style="color: #ffffff; font-size: 15px; font-weight: 600; margin: 0 0 12px 0;">📋 What Happens Next?</h4>
            <ul style="color: #a1a1aa; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
              <li>Your issue will be reviewed by our civic team</li>
              <li>You'll receive updates as the status changes</li>
              <li>Track progress anytime on your dashboard</li>
              <li>Estimated response time: 24-48 hours</li>
            </ul>
          </div>

          <!-- CTA Button -->
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/citizen/dashboard" style="display: block; background-color: #3b82f6; color: white; text-decoration: none; padding: 14px 24px; border-radius: 10px; font-weight: 600; text-align: center; font-size: 14px; margin-bottom: 20px; transition: background-color 0.2s;">
            View on Dashboard
          </a>

          <p style="font-size: 13px; color: #71717a; line-height: 1.6; margin: 0;">
            Thank you for being an active citizen and helping improve our community. We'll keep you updated via email as your issue progresses.
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #18181b; padding: 24px 32px; text-align: center; border-top: 1px solid #27272a;">
          <p style="margin: 0 0 8px 0; color: #71717a; font-size: 12px;">
            Questions? Contact us at support@civicos.com
          </p>
          <p style="margin: 0; color: #71717a; font-size: 12px;">
            © ${new Date().getFullYear()} CIVICOS. Empowering Citizens.
          </p>
        </div>
      </div>
    `,
  });

  console.log("✅ Issue created email sent:", info.messageId);
  return info;
}