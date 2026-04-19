import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Restaurant branding
const RESTAURANT_NAME = "Belly Full";
const RESTAURANT_TAGLINE = "First authentic multicuisine restaurant & café in Kishoreganj";
const RESTAURANT_PHONE = "01863-339695";
const RESTAURANT_EMAIL = "bellyfull2022@gmail.com";
const RESTAURANT_ADDRESS = "53, Opposite of Tomaltola Primary School, Rothkhola, Kishoreganj 2300";
const RESTAURANT_FACEBOOK = "https://www.facebook.com/profile.php?id=100084966930606";
const RESTAURANT_INSTAGRAM = "https://www.instagram.com/bellyfull_2022/";

// Brand colors
const PRIMARY_COLOR = "#115e59"; // Deep teal
const PRIMARY_DARK = "#0d4a47";
const ACCENT_COLOR = "#d4a853"; // Golden amber
const ACCENT_LIGHT = "#e5c177";
const CREAM_BG = "#fdfbf7";
const SUCCESS_COLOR = "#059669";
const ERROR_COLOR = "#dc2626";

const sendEmail = async (to: string, subject: string, html: string) => {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: `${RESTAURANT_NAME} <onboarding@resend.dev>`,
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

const getEmailStyles = () => `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@400;500;600&display=swap');
  
  body { 
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
    margin: 0; 
    padding: 0; 
    background-color: ${CREAM_BG}; 
    color: #1e293b;
  }
  
  .container { 
    max-width: 600px; 
    margin: 40px auto; 
    background: white; 
    border-radius: 16px; 
    overflow: hidden; 
    box-shadow: 0 10px 40px rgba(17, 94, 89, 0.15); 
  }
  
  .header { 
    background: linear-gradient(135deg, ${PRIMARY_COLOR}, ${PRIMARY_DARK}); 
    color: white; 
    padding: 40px 30px; 
    text-align: center; 
  }
  
  .logo-container {
    margin-bottom: 20px;
  }
  
  .logo-text {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 36px;
    font-weight: 700;
    color: white;
    margin: 0;
    letter-spacing: 1px;
  }
  
  .logo-tagline {
    font-size: 12px;
    color: ${ACCENT_LIGHT};
    margin-top: 8px;
    letter-spacing: 2px;
    text-transform: uppercase;
  }
  
  .status-badge {
    display: inline-block;
    padding: 12px 24px;
    border-radius: 50px;
    font-weight: 600;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-top: 20px;
  }
  
  .status-success {
    background: ${SUCCESS_COLOR};
    color: white;
  }
  
  .status-error {
    background: ${ERROR_COLOR};
    color: white;
  }
  
  .content { 
    padding: 40px 30px; 
  }
  
  .greeting {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 24px;
    color: ${PRIMARY_COLOR};
    margin-bottom: 20px;
  }
  
  .message {
    font-size: 16px;
    line-height: 1.7;
    color: #475569;
    margin-bottom: 24px;
  }
  
  .info-box { 
    background: linear-gradient(135deg, ${CREAM_BG}, #f8f6f0);
    border: 1px solid ${ACCENT_COLOR}30;
    border-radius: 12px; 
    padding: 24px; 
    margin: 24px 0; 
  }
  
  .info-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 18px;
    color: ${PRIMARY_COLOR};
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 2px solid ${ACCENT_COLOR};
  }
  
  .info-row { 
    display: flex; 
    justify-content: space-between; 
    padding: 12px 0; 
    border-bottom: 1px solid #e2e8f0; 
  }
  
  .info-row:last-child { 
    border-bottom: none; 
  }
  
  .label { 
    color: #64748b; 
    font-size: 14px;
  }
  
  .value { 
    font-weight: 600; 
    color: ${PRIMARY_COLOR}; 
    font-size: 14px;
  }
  
  .highlight-box {
    background: linear-gradient(135deg, ${PRIMARY_COLOR}10, ${PRIMARY_COLOR}05);
    border-left: 4px solid ${ACCENT_COLOR};
    padding: 16px 20px;
    margin: 24px 0;
    border-radius: 0 8px 8px 0;
  }
  
  .highlight-text {
    color: ${PRIMARY_COLOR};
    font-weight: 500;
    margin: 0;
  }
  
  .rejection-box { 
    background: #fef2f2; 
    border: 1px solid #fecaca; 
    border-radius: 12px; 
    padding: 20px; 
    margin-top: 24px; 
  }
  
  .rejection-title { 
    color: ${ERROR_COLOR}; 
    font-weight: 600;
    margin: 0 0 12px 0; 
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .rejection-text {
    color: #7f1d1d;
    margin: 0;
    line-height: 1.6;
  }
  
  .divider {
    height: 1px;
    background: linear-gradient(to right, transparent, ${ACCENT_COLOR}, transparent);
    margin: 32px 0;
  }
  
  .footer { 
    background: ${PRIMARY_COLOR}; 
    padding: 32px; 
    text-align: center; 
  }
  
  .footer-logo {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 20px;
    font-weight: 600;
    color: white;
    margin-bottom: 16px;
  }
  
  .footer-contact {
    color: ${ACCENT_LIGHT};
    font-size: 13px;
    line-height: 1.8;
    margin-bottom: 16px;
  }
  
  .footer-contact a {
    color: ${ACCENT_LIGHT};
    text-decoration: none;
  }
  
  .social-links {
    margin-top: 16px;
  }
  
  .social-link {
    display: inline-block;
    color: white;
    text-decoration: none;
    margin: 0 12px;
    font-size: 13px;
    padding: 8px 16px;
    border: 1px solid ${ACCENT_COLOR}50;
    border-radius: 20px;
    transition: all 0.3s;
  }
  
  .footer-text { 
    color: rgba(255,255,255,0.6); 
    font-size: 12px; 
    margin-top: 20px;
  }
  
  .decorative-line {
    width: 60px;
    height: 3px;
    background: ${ACCENT_COLOR};
    margin: 16px auto;
    border-radius: 2px;
  }
`;

const getOrderEmailContent = (
  action: string,
  name: string,
  details: NotificationRequest["details"]
) => {
  const isApproved = action === "approved";
  
  return {
    subject: isApproved
      ? `✨ ${RESTAURANT_NAME} - Your Order Has Been Approved!`
      : `${RESTAURANT_NAME} - Order Update`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${getEmailStyles()}</style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo-container">
              <h1 class="logo-text">${RESTAURANT_NAME}</h1>
              <p class="logo-tagline">${RESTAURANT_TAGLINE}</p>
            </div>
            <div class="decorative-line"></div>
            <span class="status-badge ${isApproved ? 'status-success' : 'status-error'}">
              ${isApproved ? '✓ Order Approved' : '✗ Order Rejected'}
            </span>
          </div>
          
          <div class="content">
            <h2 class="greeting">Hello, ${name}!</h2>
            
            <p class="message">
              ${isApproved 
                ? 'Great news! Your order has been approved and our chefs are now preparing your delicious meal with love and care.' 
                : 'We regret to inform you that we were unable to process your order at this time.'}
            </p>
            
            <div class="info-box">
              <h3 class="info-title">📋 Order Details</h3>
              <div class="info-row">
                <span class="label">Order ID</span>
                <span class="value">#${details.orderId?.slice(0, 8).toUpperCase()}</span>
              </div>
              <div class="info-row">
                <span class="label">Total Amount</span>
                <span class="value">৳${details.amount?.toLocaleString()}</span>
              </div>
              <div class="info-row">
                <span class="label">Status</span>
                <span class="value" style="color: ${isApproved ? SUCCESS_COLOR : ERROR_COLOR}">
                  ${isApproved ? '✓ Approved' : '✗ Rejected'}
                </span>
              </div>
            </div>

            ${!isApproved && details.rejectionReason ? `
              <div class="rejection-box">
                <h4 class="rejection-title">📝 Reason for Rejection</h4>
                <p class="rejection-text">${details.rejectionReason}</p>
              </div>
            ` : ''}

            ${isApproved ? `
              <div class="highlight-box">
                <p class="highlight-text">🍽️ Thank you for choosing ${RESTAURANT_NAME}! We'll notify you when your order is ready for pickup or delivery.</p>
              </div>
            ` : `
              <div class="highlight-box">
                <p class="highlight-text">📞 If you have any questions or would like to place a new order, please don't hesitate to contact us.</p>
              </div>
            `}
            
            <div class="divider"></div>
            
            <p class="message" style="text-align: center; margin-bottom: 0;">
              We appreciate your patronage and look forward to serving you!
            </p>
          </div>
          
          <div class="footer">
            <div class="footer-logo">${RESTAURANT_NAME}</div>
            <div class="footer-contact">
              📍 ${RESTAURANT_ADDRESS}<br>
              📞 <a href="tel:${RESTAURANT_PHONE}">${RESTAURANT_PHONE}</a><br>
              ✉️ <a href="mailto:${RESTAURANT_EMAIL}">${RESTAURANT_EMAIL}</a>
            </div>
            <div class="social-links">
              <a href="${RESTAURANT_FACEBOOK}" class="social-link">Facebook</a>
              <a href="${RESTAURANT_INSTAGRAM}" class="social-link">Instagram</a>
            </div>
            <p class="footer-text">© ${new Date().getFullYear()} ${RESTAURANT_NAME}. All rights reserved.</p>
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
      ? `🍽️ ${RESTAURANT_NAME} - Your Reservation is Confirmed!`
      : `${RESTAURANT_NAME} - Reservation Update`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${getEmailStyles()}</style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo-container">
              <h1 class="logo-text">${RESTAURANT_NAME}</h1>
              <p class="logo-tagline">${RESTAURANT_TAGLINE}</p>
            </div>
            <div class="decorative-line"></div>
            <span class="status-badge ${isConfirmed ? 'status-success' : 'status-error'}">
              ${isConfirmed ? '✓ Reservation Confirmed' : '✗ Reservation Cancelled'}
            </span>
          </div>
          
          <div class="content">
            <h2 class="greeting">Hello, ${name}!</h2>
            
            <p class="message">
              ${isConfirmed 
                ? 'Wonderful news! Your table reservation has been confirmed. We are excited to welcome you and provide an exceptional dining experience.' 
                : 'We regret to inform you that your reservation has been cancelled.'}
            </p>
            
            <div class="info-box">
              <h3 class="info-title">📅 Reservation Details</h3>
              <div class="info-row">
                <span class="label">Date</span>
                <span class="value">${details.date}</span>
              </div>
              <div class="info-row">
                <span class="label">Time</span>
                <span class="value">${details.time}</span>
              </div>
              <div class="info-row">
                <span class="label">Party Size</span>
                <span class="value">${details.guests} ${details.guests === 1 ? 'Guest' : 'Guests'}</span>
              </div>
              <div class="info-row">
                <span class="label">Status</span>
                <span class="value" style="color: ${isConfirmed ? SUCCESS_COLOR : ERROR_COLOR}">
                  ${isConfirmed ? '✓ Confirmed' : '✗ Cancelled'}
                </span>
              </div>
            </div>

            ${isConfirmed ? `
              <div class="highlight-box">
                <p class="highlight-text">⏰ Please arrive 5-10 minutes before your reservation time. If you need to modify or cancel your reservation, please contact us at least 2 hours in advance.</p>
              </div>
            ` : `
              <div class="highlight-box">
                <p class="highlight-text">📞 If you would like to make a new reservation, please visit our website or give us a call. We'd love to have you dine with us!</p>
              </div>
            `}
            
            <div class="divider"></div>
            
            <p class="message" style="text-align: center; margin-bottom: 0;">
              ${isConfirmed ? 'We look forward to serving you a memorable meal!' : 'We hope to welcome you soon at Belly Full!'}
            </p>
          </div>
          
          <div class="footer">
            <div class="footer-logo">${RESTAURANT_NAME}</div>
            <div class="footer-contact">
              📍 ${RESTAURANT_ADDRESS}<br>
              📞 <a href="tel:${RESTAURANT_PHONE}">${RESTAURANT_PHONE}</a><br>
              ✉️ <a href="mailto:${RESTAURANT_EMAIL}">${RESTAURANT_EMAIL}</a>
            </div>
            <div class="social-links">
              <a href="${RESTAURANT_FACEBOOK}" class="social-link">Facebook</a>
              <a href="${RESTAURANT_INSTAGRAM}" class="social-link">Instagram</a>
            </div>
            <p class="footer-text">© ${new Date().getFullYear()} ${RESTAURANT_NAME}. All rights reserved.</p>
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
    // Require authenticated admin caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userId = claimsData.claims.sub;
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleRow) {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { type, action, recipientEmail, recipientName, details }: NotificationRequest = await req.json();

    console.log(`Sending ${type} notification: ${action} to ${recipientEmail}`);

    if (!recipientEmail) {
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
      JSON.stringify({ error: "Failed to send notification" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
