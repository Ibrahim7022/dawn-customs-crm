// WhatsApp Notification Service using CallMeBot
// Free service - just requires one-time activation

/**
 * Send WhatsApp notification
 * @param {string} phone - Phone number with country code (e.g., +919876543210)
 * @param {string} apiKey - CallMeBot API key
 * @param {string} message - Message to send
 */
export async function sendWhatsAppNotification(phone, apiKey, message) {
  if (!phone || !apiKey) {
    console.log('WhatsApp notifications not configured');
    return { success: false, error: 'Not configured' };
  }

  try {
    // CallMeBot API endpoint
    const encodedMessage = encodeURIComponent(message);
    const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodedMessage}&apikey=${apiKey}`;
    
    // Use fetch with no-cors mode (CallMeBot doesn't support CORS)
    // We'll use an image trick to make the request
    const response = await fetch(url, {
      method: 'GET',
      mode: 'no-cors'
    });
    
    console.log('WhatsApp notification sent');
    return { success: true };
  } catch (error) {
    console.error('Failed to send WhatsApp notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Format job update notification
 */
export function formatJobNotification(type, data) {
  const timestamp = new Date().toLocaleString();
  
  switch (type) {
    case 'new_job':
      return `🚗 *NEW JOB CREATED*
━━━━━━━━━━━━━━━
Vehicle: ${data.vehicleMake} ${data.vehicleModel}
Plate: ${data.licensePlate}
Customer: ${data.customerName || 'N/A'}
Status: ${data.status}
━━━━━━━━━━━━━━━
📅 ${timestamp}`;

    case 'status_update':
      return `🔄 *JOB STATUS UPDATED*
━━━━━━━━━━━━━━━
Vehicle: ${data.vehicleMake} ${data.vehicleModel}
Plate: ${data.licensePlate}
Old Status: ${data.oldStatus}
New Status: ${data.newStatus}
${data.note ? `Note: ${data.note}` : ''}
━━━━━━━━━━━━━━━
📅 ${timestamp}`;

    case 'job_completed':
      return `✅ *JOB COMPLETED*
━━━━━━━━━━━━━━━
Vehicle: ${data.vehicleMake} ${data.vehicleModel}
Plate: ${data.licensePlate}
Customer: ${data.customerName || 'N/A'}
Total: $${data.totalPrice || 0}
━━━━━━━━━━━━━━━
📅 ${timestamp}`;

    case 'new_customer':
      return `👤 *NEW CUSTOMER ADDED*
━━━━━━━━━━━━━━━
Name: ${data.name}
Phone: ${data.phone || 'N/A'}
Email: ${data.email || 'N/A'}
━━━━━━━━━━━━━━━
📅 ${timestamp}`;

    case 'estimate_sent':
      const itemsText = data.items.map((item, i) => 
        `${i + 1}. ${item.description} - ₹${item.rate} × ${item.quantity} = ₹${item.quantity * item.rate}`
      ).join('\n');
      return `📋 *ESTIMATE SENT*
━━━━━━━━━━━━━━━
Estimate #: ${data.estimateNumber}
Business: ${data.businessName}

Items:
${itemsText}

Subtotal: ₹${data.subtotal.toLocaleString()}
Tax: ₹${data.tax.toLocaleString()}
*Total: ₹${data.total.toLocaleString()}*

Valid Until: ${data.validUntil}

View & Respond:
${data.estimateLink}
━━━━━━━━━━━━━━━
📅 ${timestamp}`;

    case 'job_deleted':
      return `🗑️ *JOB DELETED*
━━━━━━━━━━━━━━━
Vehicle: ${data.vehicleMake} ${data.vehicleModel}
Plate: ${data.licensePlate}
━━━━━━━━━━━━━━━
📅 ${timestamp}`;

    default:
      return `📢 *CRM UPDATE*
━━━━━━━━━━━━━━━
${JSON.stringify(data, null, 2)}
━━━━━━━━━━━━━━━
📅 ${timestamp}`;
  }
}

/**
 * Get activation instructions
 */
export function getActivationInstructions() {
  return `To enable WhatsApp notifications:

1. Save this contact: +34 644 71 98 30

2. Send this message to the number:
   "I allow callmebot to send me messages"

3. You'll receive your API key in the reply

4. Enter your phone number and API key in settings

Note: Use international format (e.g., +919876543210)`;
}
