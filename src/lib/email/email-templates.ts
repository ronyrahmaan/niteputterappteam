import { OrderDetails } from '../supabase/order-types';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface TemplateData {
  customerName: string;
  customerEmail: string;
  order: OrderDetails;
  orderTotal: string;
  orderDate: string;
  trackingInfo?: {
    carrier: string;
    trackingNumber: string;
    trackingUrl?: string;
  };
  companyName?: string;
  supportEmail?: string;
  websiteUrl?: string;
}

export class EmailTemplates {
  private static defaultCompanyName = 'NiteNite';
  private static defaultSupportEmail = 'support@nitenite.com';
  private static defaultWebsiteUrl = 'https://nitenite.com';

  /**
   * Order confirmation template
   */
  static orderConfirmation(data: TemplateData): EmailTemplate {
    const companyName = data.companyName || this.defaultCompanyName;
    const supportEmail = data.supportEmail || this.defaultSupportEmail;
    const websiteUrl = data.websiteUrl || this.defaultWebsiteUrl;

    return {
      subject: `Order Confirmation - ${data.order.order_number} | ${companyName}`,
      html: this.generateOrderConfirmationHTML(data, companyName, supportEmail, websiteUrl),
      text: this.generateOrderConfirmationText(data, companyName, supportEmail)
    };
  }

  /**
   * Shipping notification template
   */
  static shippingNotification(data: TemplateData): EmailTemplate {
    const companyName = data.companyName || this.defaultCompanyName;
    const supportEmail = data.supportEmail || this.defaultSupportEmail;
    const websiteUrl = data.websiteUrl || this.defaultWebsiteUrl;

    return {
      subject: `Your Order Has Shipped - ${data.order.order_number} | ${companyName}`,
      html: this.generateShippingNotificationHTML(data, companyName, supportEmail, websiteUrl),
      text: this.generateShippingNotificationText(data, companyName, supportEmail)
    };
  }

  /**
   * Delivery confirmation template
   */
  static deliveryConfirmation(data: TemplateData): EmailTemplate {
    const companyName = data.companyName || this.defaultCompanyName;
    const supportEmail = data.supportEmail || this.defaultSupportEmail;
    const websiteUrl = data.websiteUrl || this.defaultWebsiteUrl;

    return {
      subject: `Order Delivered - ${data.order.order_number} | ${companyName}`,
      html: this.generateDeliveryConfirmationHTML(data, companyName, supportEmail, websiteUrl),
      text: this.generateDeliveryConfirmationText(data, companyName, supportEmail)
    };
  }

  /**
   * Order cancellation template
   */
  static orderCancellation(data: TemplateData): EmailTemplate {
    const companyName = data.companyName || this.defaultCompanyName;
    const supportEmail = data.supportEmail || this.defaultSupportEmail;

    return {
      subject: `Order Cancelled - ${data.order.order_number} | ${companyName}`,
      html: this.generateOrderCancellationHTML(data, companyName, supportEmail),
      text: this.generateOrderCancellationText(data, companyName, supportEmail)
    };
  }

  /**
   * Payment failed template
   */
  static paymentFailed(data: TemplateData): EmailTemplate {
    const companyName = data.companyName || this.defaultCompanyName;
    const supportEmail = data.supportEmail || this.defaultSupportEmail;
    const websiteUrl = data.websiteUrl || this.defaultWebsiteUrl;

    return {
      subject: `Payment Failed - ${data.order.order_number} | ${companyName}`,
      html: this.generatePaymentFailedHTML(data, companyName, supportEmail, websiteUrl),
      text: this.generatePaymentFailedText(data, companyName, supportEmail)
    };
  }

  /**
   * Refund processed template
   */
  static refundProcessed(data: TemplateData & { refundAmount: string }): EmailTemplate {
    const companyName = data.companyName || this.defaultCompanyName;
    const supportEmail = data.supportEmail || this.defaultSupportEmail;

    return {
      subject: `Refund Processed - ${data.order.order_number} | ${companyName}`,
      html: this.generateRefundProcessedHTML(data, companyName, supportEmail),
      text: this.generateRefundProcessedText(data, companyName, supportEmail)
    };
  }

  // Private methods for generating HTML templates

  private static generateOrderConfirmationHTML(
    data: TemplateData,
    companyName: string,
    supportEmail: string,
    websiteUrl: string
  ): string {
    const { order, customerName, orderTotal, orderDate } = data;
    const items = order.items || [];

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; background-color: #f8f9fa; }
    .container { max-width: 600px; margin: 0 auto; background: white; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #00FF88 0%, #00D4FF 100%); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
    .header h2 { font-size: 20px; font-weight: 500; margin-bottom: 12px; }
    .header p { font-size: 16px; opacity: 0.9; }
    .content { padding: 40px 30px; }
    .order-summary { background: #f8f9fa; border-radius: 12px; padding: 24px; margin: 24px 0; }
    .order-summary h3 { color: #1a1a1a; margin-bottom: 16px; font-size: 18px; }
    .order-info { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .order-info div { background: white; padding: 16px; border-radius: 8px; border: 1px solid #e9ecef; }
    .order-info strong { color: #00FF88; font-weight: 600; }
    .items-list { margin: 24px 0; }
    .item { display: flex; justify-content: space-between; align-items: center; padding: 16px 0; border-bottom: 1px solid #e9ecef; }
    .item:last-child { border-bottom: none; }
    .item-details h4 { font-size: 16px; color: #1a1a1a; margin-bottom: 4px; }
    .item-details p { font-size: 14px; color: #6c757d; }
    .item-price { font-weight: 600; color: #1a1a1a; }
    .total-section { background: linear-gradient(135deg, #00FF88 0%, #00D4FF 100%); color: white; padding: 20px; border-radius: 8px; margin: 24px 0; }
    .total-row { display: flex; justify-content: space-between; align-items: center; }
    .total-row .amount { font-size: 24px; font-weight: 700; }
    .address-section { background: #f8f9fa; border-radius: 12px; padding: 24px; margin: 24px 0; }
    .address-section h3 { color: #1a1a1a; margin-bottom: 12px; }
    .address { line-height: 1.8; color: #495057; }
    .cta-button { display: inline-block; background: #00FF88; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; transition: background 0.2s; }
    .cta-button:hover { background: #00e077; }
    .footer { background: #1a1a1a; color: white; padding: 30px; text-align: center; }
    .footer p { margin-bottom: 8px; opacity: 0.8; }
    .footer a { color: #00FF88; text-decoration: none; }
    @media (max-width: 600px) {
      .container { margin: 0; }
      .header, .content, .footer { padding: 20px; }
      .order-info { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎮 ${companyName}</h1>
      <h2>Order Confirmation</h2>
      <p>Thank you for your order, ${customerName}!</p>
    </div>

    <div class="content">
      <div class="order-summary">
        <h3>Order Details</h3>
        <div class="order-info">
          <div>
            <strong>Order Number</strong><br>
            ${order.order_number}
          </div>
          <div>
            <strong>Order Date</strong><br>
            ${orderDate}
          </div>
        </div>

        <div class="items-list">
          <h4 style="margin-bottom: 16px; color: #1a1a1a;">Items Ordered</h4>
          ${items.map(item => `
            <div class="item">
              <div class="item-details">
                <h4>${item.product_name}</h4>
                <p>Quantity: ${item.quantity}</p>
              </div>
              <div class="item-price">$${(item.price * item.quantity / 100).toFixed(2)}</div>
            </div>
          `).join('')}
        </div>

        <div class="total-section">
          <div class="total-row">
            <span>Order Total</span>
            <span class="amount">$${orderTotal}</span>
          </div>
        </div>
      </div>

      <div class="address-section">
        <h3>📍 Shipping Address</h3>
        <div class="address">
          ${order.shipping_first_name} ${order.shipping_last_name}<br>
          ${order.shipping_street_line1}<br>
          ${order.shipping_street_line2 ? `${order.shipping_street_line2}<br>` : ''}
          ${order.shipping_city}, ${order.shipping_state_province} ${order.shipping_postal_code}<br>
          ${order.shipping_country}
        </div>
      </div>

      <p style="margin: 24px 0; line-height: 1.6;">
        We're preparing your order now! You'll receive a shipping confirmation email with tracking information once your package is on its way.
      </p>

      <a href="${websiteUrl}/track-order?order=${order.order_number}" class="cta-button">
        Track Your Order
      </a>

      <p style="margin-top: 24px; font-size: 14px; color: #6c757d;">
        Questions about your order? Reply to this email or contact us at
        <a href="mailto:${supportEmail}" style="color: #00FF88;">${supportEmail}</a>
      </p>
    </div>

    <div class="footer">
      <p><strong>Thank you for choosing ${companyName}!</strong></p>
      <p>Follow us for updates and gaming tips</p>
      <p style="margin-top: 16px;">
        <a href="${websiteUrl}">Visit our website</a> •
        <a href="mailto:${supportEmail}">Contact support</a>
      </p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private static generateOrderConfirmationText(
    data: TemplateData,
    companyName: string,
    supportEmail: string
  ): string {
    const { order, customerName, orderTotal, orderDate } = data;
    const items = order.items || [];

    return `
🎮 ${companyName} - Order Confirmation

Hi ${customerName},

Thank you for your order! Here are the details:

📦 ORDER DETAILS
Order Number: ${order.order_number}
Order Date: ${orderDate}
Total: $${orderTotal}

🛍️ ITEMS ORDERED:
${items.map(item => `• ${item.product_name} (Qty: ${item.quantity}) - $${(item.price * item.quantity / 100).toFixed(2)}`).join('\n')}

📍 SHIPPING ADDRESS:
${order.shipping_first_name} ${order.shipping_last_name}
${order.shipping_street_line1}
${order.shipping_street_line2 ? `${order.shipping_street_line2}\n` : ''}${order.shipping_city}, ${order.shipping_state_province} ${order.shipping_postal_code}
${order.shipping_country}

We're preparing your order now! You'll receive a shipping confirmation email with tracking information once your package is on its way.

Questions about your order? Reply to this email or contact us at ${supportEmail}

Thank you for choosing ${companyName}!

---
${companyName} Team
    `;
  }

  private static generateShippingNotificationHTML(
    data: TemplateData,
    companyName: string,
    supportEmail: string,
    websiteUrl: string
  ): string {
    const { order, customerName, trackingInfo } = data;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Order Has Shipped</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; background-color: #f8f9fa; }
    .container { max-width: 600px; margin: 0 auto; background: white; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #00FF88 0%, #00D4FF 100%); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
    .header h2 { font-size: 20px; font-weight: 500; margin-bottom: 12px; }
    .content { padding: 40px 30px; }
    .tracking-box { background: linear-gradient(135deg, #e8f5e8 0%, #f0f9ff 100%); border: 2px solid #00FF88; border-radius: 16px; padding: 32px; text-align: center; margin: 32px 0; }
    .tracking-box h3 { color: #1a1a1a; font-size: 22px; margin-bottom: 20px; }
    .tracking-info { background: white; border-radius: 12px; padding: 24px; margin: 20px 0; }
    .tracking-row { display: flex; justify-content: space-between; align-items: center; margin: 12px 0; }
    .tracking-label { font-weight: 600; color: #6c757d; }
    .tracking-value { font-weight: 700; color: #1a1a1a; }
    .track-button { display: inline-block; background: #00FF88; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; margin: 20px 0; transition: all 0.2s; box-shadow: 0 4px 12px rgba(0,255,136,0.3); }
    .track-button:hover { background: #00e077; transform: translateY(-2px); }
    .address-section { background: #f8f9fa; border-radius: 12px; padding: 24px; margin: 24px 0; }
    .footer { background: #1a1a1a; color: white; padding: 30px; text-align: center; }
    @media (max-width: 600px) {
      .container { margin: 0; }
      .header, .content, .footer { padding: 20px; }
      .tracking-row { flex-direction: column; align-items: flex-start; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎮 ${companyName}</h1>
      <h2>📦 Your Order Has Shipped!</h2>
      <p>Great news, ${customerName}! Your package is on its way.</p>
    </div>

    <div class="content">
      <p style="font-size: 18px; margin-bottom: 24px;">
        Your order <strong>${order.order_number}</strong> has been shipped and is heading your way!
      </p>

      <div class="tracking-box">
        <h3>📍 Track Your Package</h3>
        <div class="tracking-info">
          <div class="tracking-row">
            <span class="tracking-label">Carrier:</span>
            <span class="tracking-value">${trackingInfo?.carrier || 'Standard Shipping'}</span>
          </div>
          <div class="tracking-row">
            <span class="tracking-label">Tracking Number:</span>
            <span class="tracking-value">${trackingInfo?.trackingNumber}</span>
          </div>
        </div>
        ${trackingInfo?.trackingUrl ? `
          <a href="${trackingInfo.trackingUrl}" class="track-button">
            🚚 Track Your Package
          </a>
        ` : ''}
      </div>

      <div class="address-section">
        <h3>📍 Shipping To</h3>
        <div style="line-height: 1.8; color: #495057;">
          ${order.shipping_first_name} ${order.shipping_last_name}<br>
          ${order.shipping_street_line1}<br>
          ${order.shipping_street_line2 ? `${order.shipping_street_line2}<br>` : ''}
          ${order.shipping_city}, ${order.shipping_state_province} ${order.shipping_postal_code}<br>
          ${order.shipping_country}
        </div>
      </div>

      <p style="margin: 24px 0; line-height: 1.6;">
        We'll send you another email when your package is delivered. Thank you for your patience!
      </p>
    </div>

    <div class="footer">
      <p><strong>Thanks for choosing ${companyName}!</strong></p>
      <p>Questions? Contact us at <a href="mailto:${supportEmail}" style="color: #00FF88;">${supportEmail}</a></p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private static generateShippingNotificationText(
    data: TemplateData,
    companyName: string,
    supportEmail: string
  ): string {
    const { order, customerName, trackingInfo } = data;

    return `
🎮 ${companyName} - Your Order Has Shipped!

Hi ${customerName},

📦 Great news! Your order ${order.order_number} has been shipped and is on its way to you!

📍 TRACKING INFORMATION:
Carrier: ${trackingInfo?.carrier || 'Standard Shipping'}
Tracking Number: ${trackingInfo?.trackingNumber}
${trackingInfo?.trackingUrl ? `Track at: ${trackingInfo.trackingUrl}` : ''}

📍 SHIPPING TO:
${order.shipping_first_name} ${order.shipping_last_name}
${order.shipping_street_line1}
${order.shipping_street_line2 ? `${order.shipping_street_line2}\n` : ''}${order.shipping_city}, ${order.shipping_state_province} ${order.shipping_postal_code}
${order.shipping_country}

We'll send you another email when your package is delivered. Thank you for your patience!

Questions? Contact us at ${supportEmail}

Thanks for choosing ${companyName}!

---
${companyName} Team
    `;
  }

  private static generateDeliveryConfirmationHTML(
    data: TemplateData,
    companyName: string,
    supportEmail: string,
    websiteUrl: string
  ): string {
    const { order, customerName } = data;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Delivered</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; background-color: #f8f9fa; }
    .container { max-width: 600px; margin: 0 auto; background: white; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #00FF88 0%, #00D4FF 100%); color: white; padding: 40px 30px; text-align: center; }
    .content { padding: 40px 30px; text-align: center; }
    .success-icon { font-size: 80px; margin: 20px 0; }
    .success-box { background: linear-gradient(135deg, #e8f5e8 0%, #f0f9ff 100%); border: 2px solid #00FF88; border-radius: 16px; padding: 40px; margin: 32px 0; }
    .review-button { display: inline-block; background: #00FF88; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 700; margin: 20px 0; }
    .footer { background: #1a1a1a; color: white; padding: 30px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎮 ${companyName}</h1>
      <h2>✅ Delivered Successfully!</h2>
      <p>Your order has arrived, ${customerName}!</p>
    </div>

    <div class="content">
      <div class="success-icon">🎉</div>

      <div class="success-box">
        <h3 style="font-size: 24px; margin-bottom: 16px;">Order Delivered!</h3>
        <p style="font-size: 18px;">Your order <strong>${order.order_number}</strong> has been successfully delivered!</p>
      </div>

      <p style="margin: 24px 0; font-size: 16px;">
        We hope you love your ${companyName} products! If you have any issues with your order,
        please don't hesitate to reach out to our support team.
      </p>

      <a href="${websiteUrl}/review?order=${order.order_number}" class="review-button">
        ⭐ Leave a Review
      </a>

      <p style="margin-top: 32px; font-size: 16px;">
        Thank you for choosing ${companyName}. We appreciate your business and hope to serve you again soon!
      </p>
    </div>

    <div class="footer">
      <p><strong>Thanks for choosing ${companyName}!</strong></p>
      <p>Questions? Contact us at <a href="mailto:${supportEmail}" style="color: #00FF88;">${supportEmail}</a></p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private static generateDeliveryConfirmationText(
    data: TemplateData,
    companyName: string,
    supportEmail: string
  ): string {
    const { order, customerName } = data;

    return `
🎮 ${companyName} - Order Delivered!

Hi ${customerName},

🎉 Great news! Your order ${order.order_number} has been successfully delivered!

We hope you love your ${companyName} products! If you have any issues with your order, please don't hesitate to reach out to our support team.

We'd love to hear about your experience - consider leaving us a review!

Thank you for choosing ${companyName}. We appreciate your business and hope to serve you again soon!

Questions? Contact us at ${supportEmail}

Thanks for choosing ${companyName}!

---
${companyName} Team
    `;
  }

  private static generateOrderCancellationHTML(
    data: TemplateData,
    companyName: string,
    supportEmail: string
  ): string {
    const { order, customerName, orderTotal } = data;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Cancelled</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; background-color: #f8f9fa; }
    .container { max-width: 600px; margin: 0 auto; background: white; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: #dc3545; color: white; padding: 40px 30px; text-align: center; }
    .content { padding: 40px 30px; }
    .info-box { background: #fff3cd; border: 2px solid #ffc107; border-radius: 12px; padding: 24px; margin: 24px 0; }
    .footer { background: #1a1a1a; color: white; padding: 30px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎮 ${companyName}</h1>
      <h2>Order Cancelled</h2>
      <p>Hi ${customerName}</p>
    </div>

    <div class="content">
      <div class="info-box">
        <h3 style="margin-bottom: 16px;">Order Cancellation Notice</h3>
        <p><strong>Order Number:</strong> ${order.order_number}</p>
        <p><strong>Order Total:</strong> $${orderTotal}</p>
      </div>

      <p style="margin: 24px 0;">
        Your payment will be refunded to your original payment method within 3-5 business days.
      </p>

      <p style="margin: 24px 0;">
        If you have any questions about this cancellation or need assistance with a new order,
        please don't hesitate to contact our support team.
      </p>

      <p>We apologize for any inconvenience and appreciate your understanding.</p>
    </div>

    <div class="footer">
      <p>Thanks for your understanding!</p>
      <p>Questions? Contact us at <a href="mailto:${supportEmail}" style="color: #00FF88;">${supportEmail}</a></p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private static generateOrderCancellationText(
    data: TemplateData,
    companyName: string,
    supportEmail: string
  ): string {
    const { order, customerName, orderTotal } = data;

    return `
🎮 ${companyName} - Order Cancelled

Hi ${customerName},

Your order ${order.order_number} has been cancelled.

Order Total: $${orderTotal}

Your payment will be refunded to your original payment method within 3-5 business days.

If you have any questions about this cancellation or need assistance with a new order, please don't hesitate to contact our support team.

We apologize for any inconvenience and appreciate your understanding.

Questions? Contact us at ${supportEmail}

Thanks for your understanding!

---
${companyName} Team
    `;
  }

  private static generatePaymentFailedHTML(
    data: TemplateData,
    companyName: string,
    supportEmail: string,
    websiteUrl: string
  ): string {
    const { order, customerName, orderTotal } = data;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Failed</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; background-color: #f8f9fa; }
    .container { max-width: 600px; margin: 0 auto; background: white; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: #dc3545; color: white; padding: 40px 30px; text-align: center; }
    .content { padding: 40px 30px; }
    .warning-box { background: #f8d7da; border: 2px solid #dc3545; border-radius: 12px; padding: 24px; margin: 24px 0; }
    .retry-button { display: inline-block; background: #00FF88; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 700; margin: 20px 0; }
    .footer { background: #1a1a1a; color: white; padding: 30px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎮 ${companyName}</h1>
      <h2>⚠️ Payment Failed</h2>
      <p>Hi ${customerName}</p>
    </div>

    <div class="content">
      <div class="warning-box">
        <h3 style="margin-bottom: 16px;">Payment Processing Failed</h3>
        <p><strong>Order Number:</strong> ${order.order_number}</p>
        <p><strong>Order Total:</strong> $${orderTotal}</p>
        <p style="margin-top: 12px;">We were unable to process your payment for this order.</p>
      </div>

      <p style="margin: 24px 0;">
        Don't worry! Your order is still reserved for a limited time. You can try again with:
      </p>

      <ul style="margin: 16px 0 24px 20px;">
        <li>A different payment method</li>
        <li>Updated card information</li>
        <li>Contacting your bank if needed</li>
      </ul>

      <a href="${websiteUrl}/retry-payment?order=${order.order_number}" class="retry-button">
        💳 Retry Payment
      </a>

      <p style="margin-top: 24px;">
        If you continue to experience issues, please contact our support team for assistance.
      </p>
    </div>

    <div class="footer">
      <p>Need help? We're here for you!</p>
      <p>Questions? Contact us at <a href="mailto:${supportEmail}" style="color: #00FF88;">${supportEmail}</a></p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private static generatePaymentFailedText(
    data: TemplateData,
    companyName: string,
    supportEmail: string
  ): string {
    const { order, customerName, orderTotal } = data;

    return `
🎮 ${companyName} - Payment Failed

Hi ${customerName},

⚠️ We were unable to process your payment for order ${order.order_number} ($${orderTotal}).

Don't worry! Your order is still reserved for a limited time. You can try again with:
• A different payment method
• Updated card information
• Contacting your bank if needed

If you continue to experience issues, please contact our support team for assistance.

Questions? Contact us at ${supportEmail}

Need help? We're here for you!

---
${companyName} Team
    `;
  }

  private static generateRefundProcessedHTML(
    data: TemplateData & { refundAmount: string },
    companyName: string,
    supportEmail: string
  ): string {
    const { order, customerName, refundAmount } = data;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Refund Processed</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; background-color: #f8f9fa; }
    .container { max-width: 600px; margin: 0 auto; background: white; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #00FF88 0%, #00D4FF 100%); color: white; padding: 40px 30px; text-align: center; }
    .content { padding: 40px 30px; }
    .success-box { background: #d1edff; border: 2px solid #0ea5e9; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center; }
    .footer { background: #1a1a1a; color: white; padding: 30px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎮 ${companyName}</h1>
      <h2>💰 Refund Processed</h2>
      <p>Hi ${customerName}</p>
    </div>

    <div class="content">
      <div class="success-box">
        <h3 style="margin-bottom: 16px;">✅ Refund Successfully Processed</h3>
        <p><strong>Order Number:</strong> ${order.order_number}</p>
        <p><strong>Refund Amount:</strong> $${refundAmount}</p>
      </div>

      <p style="margin: 24px 0;">
        Your refund has been processed and should appear in your original payment method within 3-5 business days.
      </p>

      <p style="margin: 24px 0;">
        Thank you for your patience, and we apologize for any inconvenience. We hope to serve you again in the future!
      </p>
    </div>

    <div class="footer">
      <p>Thanks for your understanding!</p>
      <p>Questions? Contact us at <a href="mailto:${supportEmail}" style="color: #00FF88;">${supportEmail}</a></p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private static generateRefundProcessedText(
    data: TemplateData & { refundAmount: string },
    companyName: string,
    supportEmail: string
  ): string {
    const { order, customerName, refundAmount } = data;

    return `
🎮 ${companyName} - Refund Processed

Hi ${customerName},

✅ Your refund has been successfully processed!

Order Number: ${order.order_number}
Refund Amount: $${refundAmount}

Your refund should appear in your original payment method within 3-5 business days.

Thank you for your patience, and we apologize for any inconvenience. We hope to serve you again in the future!

Questions? Contact us at ${supportEmail}

Thanks for your understanding!

---
${companyName} Team
    `;
  }
}