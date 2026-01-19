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

// Send job status update email to customer
export const sendJobStatusEmail = async (config) => {
  const {
    serviceId,
    templateId,
    publicKey,
    toEmail,
    toName,
    businessName,
    vehicleMake,
    vehicleModel,
    licensePlate,
    oldStatus,
    newStatus,
    note,
    isCompleted,
    totalPrice
  } = config;

  if (!serviceId || !templateId || !publicKey) {
    throw new Error('EmailJS not configured. Please set up EmailJS in Settings.');
  }

  try {
    initEmailJS(publicKey);

    let subject, message;
    
    if (isCompleted) {
      subject = `Your Vehicle is Ready for Pickup - ${businessName}`;
      message = `Great news! Your vehicle customization is complete and ready for pickup.

Vehicle Details:
- Make & Model: ${vehicleMake} ${vehicleModel}
- License Plate: ${licensePlate}

Your vehicle is now ready for pickup. Please contact us to schedule a convenient time.

${totalPrice ? `Total Amount: ₹${totalPrice.toLocaleString()}` : ''}

Thank you for choosing ${businessName}!`;
    } else {
      subject = `Job Status Update - ${businessName}`;
      message = `Your vehicle customization status has been updated.

Vehicle Details:
- Make & Model: ${vehicleMake} ${vehicleModel}
- License Plate: ${licensePlate}

Status Update:
- Previous Status: ${oldStatus}
- Current Status: ${newStatus}
${note ? `\nNote: ${note}` : ''}

We'll keep you updated as your vehicle progresses through the customization process.

Thank you for choosing ${businessName}!`;
    }

    const templateParams = {
      to_email: toEmail,
      to_name: toName,
      subject: subject,
      message: message,
      business_name: businessName,
      vehicle_make: vehicleMake,
      vehicle_model: vehicleModel,
      license_plate: licensePlate,
      old_status: oldStatus || '',
      new_status: newStatus,
      note: note || '',
      total_price: totalPrice ? `₹${totalPrice.toLocaleString()}` : '',
      reply_to: toEmail
    };

    const response = await emailjs.send(serviceId, templateId, templateParams);
    return { success: true, messageId: response.text };
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error(`Failed to send email: ${error.text || error.message}`);
  }
};
