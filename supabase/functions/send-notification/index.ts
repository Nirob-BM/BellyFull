import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const sendEmail = async (to: string, subject: string, html: string) => {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Restaurant <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }

  return response.json();
};

interface NotificationRequest {
  type: "order" | "reservation";
  action: "approved" | "rejected" | "confirmed" | "cancelled";
  recipientEmail: string;
  recipientName: string;
  details: {
    orderId?: string;
    reservationId?: string;
    amount?: number;
    date?: string;
    time?: string;
    guests?: number;
    rejectionReason?: string;
  };
}

const getOrderEmailContent = (
  action: string,
  name: string,
  details: NotificationRequest["details"]
) => {
  const isApproved = action === "approved";
  
  return {
    subject: isApproved
      ? "🎉 Your Order Has Been Approved!"
      : "❌ Order Update - Action Required",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: ${isApproved ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)'}; color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { padding: 30px; }
          .info-box { background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
          .info-row:last-child { border-bottom: none; }
          .label { color: #64748b; }
          .value { font-weight: 600; color: #1e293b; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
          .rejection-reason { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; margin-top: 20px; }
          .rejection-reason h4 { color: #dc2626; margin: 0 0 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${isApproved ? '✓ Order Approved!' : '✗ Order Rejected'}</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${name}</strong>,</p>
            <p>${isApproved 
              ? 'Great news! Your order has been approved and is being prepared.' 
              : 'We regret to inform you that your order could not be processed.'}</p>
            
            <div class="info-box">
              <div class="info-row">
                <span class="label">Order ID</span>
                <span class="value">${details.orderId?.slice(0, 8)}...</span>
              </div>
              <div class="info-row">
                <span class="label">Amount</span>
                <span class="value">৳${details.amount}</span>
              </div>
              <div class="info-row">
                <span class="label">Status</span>
                <span class="value" style="color: ${isApproved ? '#10b981' : '#ef4444'}">${action.toUpperCase()}</span>
              </div>
            </div>

            ${!isApproved && details.rejectionReason ? `
              <div class="rejection-reason">
                <h4>Reason for Rejection</h4>
                <p>${details.rejectionReason}</p>
              </div>
            ` : ''}

            ${isApproved ? '<p>Thank you for your order! We will notify you when it\'s ready.</p>' : '<p>If you have any questions, please contact us.</p>'}
          </div>
          <div class="footer">
            <p>Thank you for choosing us!</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
};

const getReservationEmailContent = (
  action: string,
  name: string,
  details: NotificationRequest["details"]
) => {
  const isConfirmed = action === "confirmed";
  
  return {
    subject: isConfirmed
      ? "🎉 Your Reservation is Confirmed!"
      : "❌ Reservation Update",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: ${isConfirmed ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)'}; color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { padding: 30px; }
          .info-box { background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
          .info-row:last-child { border-bottom: none; }
          .label { color: #64748b; }
          .value { font-weight: 600; color: #1e293b; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${isConfirmed ? '✓ Reservation Confirmed!' : '✗ Reservation Cancelled'}</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${name}</strong>,</p>
            <p>${isConfirmed 
              ? 'Your table reservation has been confirmed. We look forward to seeing you!' 
              : 'Unfortunately, your reservation has been cancelled.'}</p>
            
            <div class="info-box">
              <div class="info-row">
                <span class="label">Date</span>
                <span class="value">${details.date}</span>
              </div>
              <div class="info-row">
                <span class="label">Time</span>
                <span class="value">${details.time}</span>
              </div>
              <div class="info-row">
                <span class="label">Guests</span>
                <span class="value">${details.guests} people</span>
              </div>
              <div class="info-row">
                <span class="label">Status</span>
                <span class="value" style="color: ${isConfirmed ? '#10b981' : '#ef4444'}">${action.toUpperCase()}</span>
              </div>
            </div>

            ${isConfirmed ? '<p>Please arrive 5-10 minutes before your reservation time.</p>' : '<p>If you would like to make a new reservation, please visit our website.</p>'}
          </div>
          <div class="footer">
            <p>Thank you for choosing us!</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, action, recipientEmail, recipientName, details }: NotificationRequest = await req.json();

    console.log(`Sending ${type} notification: ${action} to ${recipientEmail}`);

    if (!recipientEmail) {
      console.log("No recipient email provided, skipping notification");
      return new Response(
        JSON.stringify({ success: true, message: "No email provided, notification skipped" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const emailContent = type === "order"
      ? getOrderEmailContent(action, recipientName, details)
      : getReservationEmailContent(action, recipientName, details);

    const emailResponse = await sendEmail(
      recipientEmail,
      emailContent.subject,
      emailContent.html
    );

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
