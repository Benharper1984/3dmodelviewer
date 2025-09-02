import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      notificationType,  // 'admin-to-client' or 'client-to-admin'
      senderName,
      message,
      screenshotId,
      commentText,
      jobId,
      action
    } = req.body;

    let emailConfig;

    if (notificationType === 'admin-to-client') {
      // Admin (you) sending to client - manual only
      emailConfig = {
        from: 'notifications@resend.dev', // Using resend.dev for testing
        to: ['daviddoneone@aol.com'], // The Thoughtful Father's email
        subject: `📋 Update from Your Designer - Project ${jobId}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
            <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #667eea; margin-top: 0;">
                💌 Message from Your Designer
              </h2>
              
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0;">📝 Ben Says:</h3>
                <p style="font-size: 16px; margin: 0; line-height: 1.5;">"${message}"</p>
              </div>

              <div style="background: #e8f4fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="margin: 0 0 10px 0; color: #1976d2;">📋 Project Details:</h4>
                <ul style="margin: 0; padding-left: 20px;">
                  <li><strong>Project:</strong> ${jobId}</li>
                  <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.VERCEL_URL || 'https://your-vercel-url.vercel.app'}/screenshot-test.html?user=LotuS" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                  🔗 View Your Project
                </a>
              </div>

              <p style="color: #666; font-size: 12px; text-align: center; margin: 30px 0 0 0;">
                This message was sent from your 3D Model Viewer project.
              </p>
            </div>
          </div>
        `,
      };
    } else {
      // Client sending to admin (you) - auto-notifications enabled
      emailConfig = {
        from: 'notifications@resend.dev',
        to: ['benharper1984@gmail.com'], // Your email
        subject: `🔔 Client Activity - ${senderName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #667eea;">🔔 Client Activity Alert</h2>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>📋 Activity Details:</h3>
              <ul style="list-style: none; padding: 0;">
                <li><strong>Client:</strong> ${senderName}</li>
                <li><strong>Action:</strong> ${action}</li>
                <li><strong>Project:</strong> ${jobId}</li>
                <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
              </ul>
            </div>

            ${commentText ? `
              <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                <h4>💬 Comment Added:</h4>
                <p style="font-style: italic; margin: 0;">"${commentText}"</p>
              </div>
            ` : ''}

            ${message ? `
              <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
                <h4>📨 Client Message:</h4>
                <p style="font-style: italic; margin: 0;">"${message}"</p>
              </div>
            ` : ''}

            <div style="margin: 30px 0;">
              <a href="${process.env.VERCEL_URL || 'https://your-vercel-url.vercel.app'}/screenshot-test.html?user=testing123" 
                 style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View Project 🔗
              </a>
            </div>

            <p style="color: #666; font-size: 12px;">
              This notification was sent from your 3D Model Viewer project.
            </p>
          </div>
        `,
      };
    }

    const { data, error } = await resend.emails.send(emailConfig);

    if (error) {
      console.error('Email send error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json({ success: true, messageId: data.id });
  } catch (error) {
    console.error('Notification error:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
}
