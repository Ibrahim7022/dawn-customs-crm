import emailjs from '@emailjs/browser';

// Initialize EmailJS (user needs to set this up in settings)
export const initEmailJS = (publicKey) => {
  if (publicKey) {
    emailjs.init(publicKey);
  }
};

// Send estimate via email
export const sendEstimateEmail = async (config) => {
  const {
    serviceId,
    templateId,
    publicKey,
    toEmail,
    toName,
    estimateNumber,
    estimateLink,
    businessName,
    items,
    subtotal,
    tax,
    total,
    validUntil
  } = config;

  if (!serviceId || !templateId || !publicKey) {
    throw new Error('EmailJS not configured. Please set up EmailJS in Settings.');
  }

  try {
    initEmailJS(publicKey);

    // Format items for email
    const itemsHtml = items.map((item, index) => 
      `${index + 1}. ${item.description} - Qty: ${item.quantity} × ₹${item.rate} = ₹${item.quantity * item.rate}`
    ).join('\n');

    const templateParams = {
      to_email: toEmail,
      to_name: toName,
      estimate_number: estimateNumber,
      estimate_link: estimateLink,
      business_name: businessName,
      items: itemsHtml,
      subtotal: `₹${subtotal.toLocaleString()}`,
      tax: `₹${tax.toLocaleString()}`,
      total: `₹${total.toLocaleString()}`,
      valid_until: validUntil,
      reply_to: toEmail
    };

    const response = await emailjs.send(serviceId, templateId, templateParams);
    return { success: true, messageId: response.text };
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error(`Failed to send email: ${error.text || error.message}`);
  }
};

// Send simple email notification
export const sendEmail = async (config) => {
  const {
    serviceId,
    templateId,
    publicKey,
    toEmail,
    toName,
    subject,
    message,
    link
  } = config;

  if (!serviceId || !templateId || !publicKey) {
    throw new Error('EmailJS not configured');
  }

  try {
    initEmailJS(publicKey);

    const templateParams = {
      to_email: toEmail,
      to_name: toName,
      subject: subject,
      message: message,
      link: link || '',
      reply_to: toEmail
    };

    const response = await emailjs.send(serviceId, templateId, templateParams);
    return { success: true, messageId: response.text };
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error(`Failed to send email: ${error.text || error.message}`);
  }
};
