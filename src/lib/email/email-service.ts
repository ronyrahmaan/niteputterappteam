import sgMail from '@sendgrid/mail';
import { Order, OrderDetails } from '../supabase/order-types';

// Configure SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export interface EmailConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
  replyToEmail?: string;
}

export interface OrderEmailData {
  order: OrderDetails;
  customerName: string;
  customerEmail: string;
  orderTotal: string;
  orderDate: string;
  trackingInfo?: {
    carrier: string;
    trackingNumber: string;
    trackingUrl?: string;
  };
}

export class EmailService {
  private static config: EmailConfig;

  static configure(config: EmailConfig) {
    this.config = config;
    sgMail.setApiKey(config.apiKey);
  }

  /**
   * Send order confirmation email
   */
  static async sendOrderConfirmation(data: OrderEmailData): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.config) {
        throw new Error('Email service not configured');
      }

      const msg = {
        to: data.customerEmail,
        from: {
          email: this.config.fromEmail,
          name: this.config.fromName
        },
        replyTo: this.config.replyToEmail || this.config.fromEmail,
        subject: `Order Confirmation - ${data.order.order_number}`,
        html: this.generateOrderConfirmationHTML(data),
        text: this.generateOrderConfirmationText(data)
      };

      await sgMail.send(msg);
      return { success: true };
    } catch (error) {
      console.error('Failed to send order confirmation email:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send shipping notification email
   */
  static async sendShippingNotification(data: OrderEmailData): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.config) {
        throw new Error('Email service not configured');
      }

      if (!data.trackingInfo) {
        throw new Error('Tracking information required for shipping notification');
      }

      const msg = {
        to: data.customerEmail,
        from: {
          email: this.config.fromEmail,
          name: this.config.fromName
        },
        replyTo: this.config.replyToEmail || this.config.fromEmail,
        subject: `Your Order Has Shipped - ${data.order.order_number}`,
        html: this.generateShippingNotificationHTML(data),
        text: this.generateShippingNotificationText(data)
      };

      await sgMail.send(msg);
      return { success: true };
    } catch (error) {
      console.error('Failed to send shipping notification email:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send order delivered notification
   */
  static async sendDeliveryNotification(data: OrderEmailData): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.config) {
        throw new Error('Email service not configured');
      }

      const msg = {
        to: data.customerEmail,
        from: {
          email: this.config.fromEmail,
          name: this.config.fromName
        },
        replyTo: this.config.replyToEmail || this.config.fromEmail,
        subject: `Your Order Has Been Delivered - ${data.order.order_number}`,
        html: this.generateDeliveryNotificationHTML(data),
        text: this.generateDeliveryNotificationText(data)
      };

      await sgMail.send(msg);
      return { success: true };
    } catch (error) {
      console.error('Failed to send delivery notification email:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send order cancellation email
   */
  static async sendOrderCancellation(data: OrderEmailData): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.config) {
        throw new Error('Email service not configured');
      }

      const msg = {
        to: data.customerEmail,
        from: {
          email: this.config.fromEmail,
          name: this.config.fromName
        },
        replyTo: this.config.replyToEmail || this.config.fromEmail,
        subject: `Order Cancelled - ${data.order.order_number}`,
        html: this.generateOrderCancellationHTML(data),
        text: this.generateOrderCancellationText(data)
      };

      await sgMail.send(msg);
      return { success: true };
    } catch (error) {
      console.error('Failed to send order cancellation email:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Generate order confirmation HTML email
   */
  private static generateOrderConfirmationHTML(data: OrderEmailData): string {
    const { order, customerName, orderTotal, orderDate } = data;
    const items = order.items || [];

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #00FF88, #00D4FF); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; }
    .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .item { border-bottom: 1px solid #eee; padding: 15px 0; display: flex; justify-content: space-between; }
    .item:last-child { border-bottom: none; }
    .total-row { font-weight: bold; font-size: 18px; color: #00FF88; }
    .footer { background: #333; color: white; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
    .button { background: #00FF88; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎮 NiteNite</h1>
      <h2>Order Confirmation</h2>
      <p>Thank you for your order, ${customerName}!</p>
    </div>

    <div class="content">
      <div class="order-details">
        <h3>Order Details</h3>
        <p><strong>Order Number:</strong> ${order.order_number}</p>
        <p><strong>Order Date:</strong> ${orderDate}</p>
        <p><strong>Total:</strong> $${orderTotal}</p>

        <h4>Items Ordered:</h4>
        ${items.map(item => `
          <div class="item">
            <div>
              <strong>${item.product_name}</strong><br>
              <small>Qty: ${item.quantity}</small>
            </div>
            <div>$${(item.price * item.quantity / 100).toFixed(2)}</div>
          </div>
        `).join('')}

        <div class="item total-row">
          <div>Total</div>
          <div>$${orderTotal}</div>
        </div>
      </div>

      <div class="order-details">
        <h3>Shipping Address</h3>
        <p>
          ${order.shipping_first_name} ${order.shipping_last_name}<br>
          ${order.shipping_street_line1}<br>
          ${order.shipping_street_line2 ? `${order.shipping_street_line2}<br>` : ''}
          ${order.shipping_city}, ${order.shipping_state_province} ${order.shipping_postal_code}<br>
          ${order.shipping_country}
        </p>
      </div>

      <p>We'll send you another email when your order ships. If you have any questions, please don't hesitate to contact us.</p>

      <a href="#" class="button">Track Your Order</a>
    </div>

    <div class="footer">
      <p>Thanks for choosing NiteNite!</p>
      <p>Questions? Reply to this email or contact support.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate order confirmation text email
   */
  private static generateOrderConfirmationText(data: OrderEmailData): string {
    const { order, customerName, orderTotal, orderDate } = data;
    const items = order.items || [];

    return `
🎮 NiteNite - Order Confirmation

Hi ${customerName},

Thank you for your order! Here are the details:

Order Number: ${order.order_number}
Order Date: ${orderDate}
Total: $${orderTotal}

Items Ordered:
${items.map(item => `• ${item.product_name} (Qty: ${item.quantity}) - $${(item.price * item.quantity / 100).toFixed(2)}`).join('\n')}

Shipping Address:
${order.shipping_first_name} ${order.shipping_last_name}
${order.shipping_street_line1}
${order.shipping_street_line2 ? `${order.shipping_street_line2}\n` : ''}${order.shipping_city}, ${order.shipping_state_province} ${order.shipping_postal_code}
${order.shipping_country}

We'll send you another email when your order ships. If you have any questions, please don't hesitate to contact us.

Thanks for choosing NiteNite!

Questions? Reply to this email or contact support.
    `;
  }

  /**
   * Generate shipping notification HTML email
   */
  private static generateShippingNotificationHTML(data: OrderEmailData): string {
    const { order, customerName, trackingInfo } = data;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Order Has Shipped</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #00FF88, #00D4FF); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; }
    .shipping-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .footer { background: #333; color: white; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
    .button { background: #00FF88; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }
    .tracking-box { background: #e8f5e8; border: 2px solid #00FF88; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎮 NiteNite</h1>
      <h2>📦 Your Order Has Shipped!</h2>
      <p>Great news, ${customerName}!</p>
    </div>

    <div class="content">
      <p>Your order <strong>${order.order_number}</strong> has been shipped and is on its way to you!</p>

      <div class="tracking-box">
        <h3>📍 Tracking Information</h3>
        <p><strong>Carrier:</strong> ${trackingInfo?.carrier}</p>
        <p><strong>Tracking Number:</strong> ${trackingInfo?.trackingNumber}</p>
        ${trackingInfo?.trackingUrl ? `<a href="${trackingInfo.trackingUrl}" class="button">Track Your Package</a>` : ''}
      </div>

      <div class="shipping-details">
        <h3>Shipping Address</h3>
        <p>
          ${order.shipping_first_name} ${order.shipping_last_name}<br>
          ${order.shipping_street_line1}<br>
          ${order.shipping_street_line2 ? `${order.shipping_street_line2}<br>` : ''}
          ${order.shipping_city}, ${order.shipping_state_province} ${order.shipping_postal_code}<br>
          ${order.shipping_country}
        </p>
      </div>

      <p>We'll send you another email when your package is delivered. Thanks for your patience!</p>
    </div>

    <div class="footer">
      <p>Thanks for choosing NiteNite!</p>
      <p>Questions? Reply to this email or contact support.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate shipping notification text email
   */
  private static generateShippingNotificationText(data: OrderEmailData): string {
    const { order, customerName, trackingInfo } = data;

    return `
🎮 NiteNite - Your Order Has Shipped!

Hi ${customerName},

Great news! Your order ${order.order_number} has been shipped and is on its way to you!

📍 Tracking Information:
Carrier: ${trackingInfo?.carrier}
Tracking Number: ${trackingInfo?.trackingNumber}
${trackingInfo?.trackingUrl ? `Track at: ${trackingInfo.trackingUrl}` : ''}

Shipping Address:
${order.shipping_first_name} ${order.shipping_last_name}
${order.shipping_street_line1}
${order.shipping_street_line2 ? `${order.shipping_street_line2}\n` : ''}${order.shipping_city}, ${order.shipping_state_province} ${order.shipping_postal_code}
${order.shipping_country}

We'll send you another email when your package is delivered. Thanks for your patience!

Thanks for choosing NiteNite!

Questions? Reply to this email or contact support.
    `;
  }

  /**
   * Generate delivery notification HTML email
   */
  private static generateDeliveryNotificationHTML(data: OrderEmailData): string {
    const { order, customerName } = data;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Order Has Been Delivered</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #00FF88, #00D4FF); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; }
    .footer { background: #333; color: white; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
    .button { background: #00FF88; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }
    .success-box { background: #e8f5e8; border: 2px solid #00FF88; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎮 NiteNite</h1>
      <h2>✅ Delivered!</h2>
      <p>Your order has arrived, ${customerName}!</p>
    </div>

    <div class="content">
      <div class="success-box">
        <h3>🎉 Order Delivered Successfully!</h3>
        <p>Your order <strong>${order.order_number}</strong> has been delivered!</p>
      </div>

      <p>We hope you enjoy your NiteNite products! If you have any issues with your order, please don't hesitate to reach out to our support team.</p>

      <p>We'd love to hear about your experience:</p>
      <a href="#" class="button">Leave a Review</a>

      <p>Thank you for choosing NiteNite. We appreciate your business!</p>
    </div>

    <div class="footer">
      <p>Thanks for choosing NiteNite!</p>
      <p>Questions? Reply to this email or contact support.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate delivery notification text email
   */
  private static generateDeliveryNotificationText(data: OrderEmailData): string {
    const { order, customerName } = data;

    return `
🎮 NiteNite - Order Delivered!

Hi ${customerName},

🎉 Great news! Your order ${order.order_number} has been delivered!

We hope you enjoy your NiteNite products! If you have any issues with your order, please don't hesitate to reach out to our support team.

We'd love to hear about your experience - consider leaving us a review!

Thank you for choosing NiteNite. We appreciate your business!

Questions? Reply to this email or contact support.
    `;
  }

  /**
   * Generate order cancellation HTML email
   */
  private static generateOrderCancellationHTML(data: OrderEmailData): string {
    const { order, customerName, orderTotal } = data;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Cancelled</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #ff6b6b; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; }
    .footer { background: #333; color: white; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
    .info-box { background: #fff3cd; border: 2px solid #ffc107; padding: 20px; border-radius: 8px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎮 NiteNite</h1>
      <h2>Order Cancelled</h2>
      <p>Hi ${customerName}</p>
    </div>

    <div class="content">
      <div class="info-box">
        <h3>Order Cancellation Notice</h3>
        <p>Your order <strong>${order.order_number}</strong> has been cancelled.</p>
        <p><strong>Order Total:</strong> $${orderTotal}</p>
      </div>

      <p>Your payment will be refunded to your original payment method within 3-5 business days.</p>

      <p>If you have any questions about this cancellation or need assistance with a new order, please don't hesitate to contact our support team.</p>

      <p>We apologize for any inconvenience and appreciate your understanding.</p>
    </div>

    <div class="footer">
      <p>Thanks for your understanding!</p>
      <p>Questions? Reply to this email or contact support.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate order cancellation text email
   */
  private static generateOrderCancellationText(data: OrderEmailData): string {
    const { order, customerName, orderTotal } = data;

    return `
🎮 NiteNite - Order Cancelled

Hi ${customerName},

Your order ${order.order_number} has been cancelled.

Order Total: $${orderTotal}

Your payment will be refunded to your original payment method within 3-5 business days.

If you have any questions about this cancellation or need assistance with a new order, please don't hesitate to contact our support team.

We apologize for any inconvenience and appreciate your understanding.

Thanks for your understanding!

Questions? Reply to this email or contact support.
    `;
  }
}