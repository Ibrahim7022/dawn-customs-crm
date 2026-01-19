import { useCrmStore } from '../store/crmStore';
import { sendWhatsAppNotification, formatJobNotification } from '../utils/whatsapp';
import { sendJobStatusEmail } from '../utils/email';

export function useNotifications() {
  const settings = useCrmStore((state) => state.settings);
  const customers = useCrmStore((state) => state.customers);
  const statuses = useCrmStore((state) => state.statuses);

  const getStatusName = (statusId) => {
    const status = statuses.find(s => s.id === statusId);
    return status?.name || statusId;
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || 'Unknown';
  };

  const sendNotification = async (type, data) => {
    const { whatsapp } = settings;
    
    if (!whatsapp?.enabled || !whatsapp?.phone || !whatsapp?.apiKey) {
      return;
    }

    // Check notification preferences
    if (type === 'new_job' && !whatsapp.notifyNewJob) return;
    if (type === 'status_update' && !whatsapp.notifyStatusChange) return;
    if (type === 'job_completed' && !whatsapp.notifyJobComplete) return;
    if (type === 'new_customer' && !whatsapp.notifyNewCustomer) return;

    const message = formatJobNotification(type, data);
    await sendWhatsAppNotification(whatsapp.phone, whatsapp.apiKey, message);
  };

  const notifyNewJob = async (job) => {
    // Notify admin
    await sendNotification('new_job', {
      vehicleMake: job.vehicleMake,
      vehicleModel: job.vehicleModel,
      licensePlate: job.licensePlate,
      customerName: getCustomerName(job.customerId),
      status: getStatusName(job.status),
    });

    // Notify customer
    const customer = customers.find(c => c.id === job.customerId);
    if (!customer) return;

    const { emailjs, whatsapp, businessName } = settings;

    // Send email to customer if configured
    if (emailjs?.enabled && emailjs?.serviceId && emailjs?.templateId && emailjs?.publicKey && customer.email) {
      try {
        const { sendEmail } = await import('../utils/email');
        await sendEmail({
          serviceId: emailjs.serviceId,
          templateId: emailjs.templateId,
          publicKey: emailjs.publicKey,
          toEmail: customer.email,
          toName: customer.name,
          subject: `Job Created - ${businessName || 'Dawn Customs'}`,
          message: `Thank you for choosing ${businessName || 'Dawn Customs'}!

Your vehicle customization job has been created.

Vehicle Details:
- Make & Model: ${job.vehicleMake} ${job.vehicleModel}
- License Plate: ${job.licensePlate}
- Status: ${getStatusName(job.status)}

We'll keep you updated on the progress of your vehicle customization.

Thank you!`,
          link: ''
        });
        console.log('New job email sent to customer');
      } catch (error) {
        console.error('Failed to send email to customer:', error);
      }
    }

    // Send WhatsApp to customer if configured
    if (whatsapp?.enabled && whatsapp?.apiKey && customer.phone) {
      try {
        const customerMessage = `🚗 *JOB CREATED*
━━━━━━━━━━━━━━━
${businessName || 'Dawn Customs'}

Thank you for choosing us!

Your vehicle customization job has been created.

🚗 *Vehicle Details:*
${job.vehicleMake} ${job.vehicleModel}
Plate: ${job.licensePlate}
Status: ${getStatusName(job.status)}

We'll keep you updated on the progress!

Thank you! 🚀
━━━━━━━━━━━━━━━
📅 ${new Date().toLocaleString()}`;
        
        await sendWhatsAppNotification(
          customer.phone,
          whatsapp.apiKey,
          customerMessage
        );
        console.log('New job WhatsApp sent to customer');
      } catch (error) {
        console.error('Failed to send WhatsApp to customer:', error);
      }
    }
  };

  const notifyStatusUpdate = async (job, oldStatus, newStatus, note) => {
    const isCompleted = newStatus === 'delivered';
    
    // Notify admin (existing functionality)
    if (isCompleted) {
      await sendNotification('job_completed', {
        vehicleMake: job.vehicleMake,
        vehicleModel: job.vehicleModel,
        licensePlate: job.licensePlate,
        customerName: getCustomerName(job.customerId),
        totalPrice: job.totalPrice,
      });
    } else {
      await sendNotification('status_update', {
        vehicleMake: job.vehicleMake,
        vehicleModel: job.vehicleModel,
        licensePlate: job.licensePlate,
        oldStatus: getStatusName(oldStatus),
        newStatus: getStatusName(newStatus),
        note,
      });
    }

    // Notify customer
    await notifyCustomerStatusUpdate(job, oldStatus, newStatus, note, isCompleted);
  };

  const notifyCustomerStatusUpdate = async (job, oldStatus, newStatus, note, isCompleted) => {
    const customer = customers.find(c => c.id === job.customerId);
    if (!customer) return;

    const oldStatusName = getStatusName(oldStatus);
    const newStatusName = getStatusName(newStatus);
    const { emailjs, whatsapp, businessName } = settings;

    // Send email to customer if configured
    if (emailjs?.enabled && emailjs?.serviceId && emailjs?.templateId && emailjs?.publicKey && customer.email) {
      try {
        await sendJobStatusEmail({
          serviceId: emailjs.serviceId,
          templateId: emailjs.templateId,
          publicKey: emailjs.publicKey,
          toEmail: customer.email,
          toName: customer.name,
          businessName: businessName || 'Dawn Customs',
          vehicleMake: job.vehicleMake,
          vehicleModel: job.vehicleModel,
          licensePlate: job.licensePlate,
          oldStatus: oldStatusName,
          newStatus: newStatusName,
          note: note || '',
          isCompleted,
          totalPrice: isCompleted ? job.totalPrice : null
        });
        console.log('Job status email sent to customer');
      } catch (error) {
        console.error('Failed to send email to customer:', error);
      }
    }

    // Send WhatsApp to customer if configured
    if (whatsapp?.enabled && whatsapp?.apiKey && customer.phone) {
      try {
        const customerMessage = formatJobNotification('job_status_customer', {
          businessName: businessName || 'Dawn Customs',
          vehicleMake: job.vehicleMake,
          vehicleModel: job.vehicleModel,
          licensePlate: job.licensePlate,
          oldStatus: oldStatusName,
          newStatus: newStatusName,
          note: note || '',
          isCompleted,
          totalPrice: isCompleted ? job.totalPrice : null
        });
        
        await sendWhatsAppNotification(
          customer.phone,
          whatsapp.apiKey,
          customerMessage
        );
        console.log('Job status WhatsApp sent to customer');
      } catch (error) {
        console.error('Failed to send WhatsApp to customer:', error);
      }
    }
  };

  const notifyNewCustomer = async (customer) => {
    await sendNotification('new_customer', {
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
    });
  };

  const notifyJobDeleted = async (job) => {
    await sendNotification('job_deleted', {
      vehicleMake: job.vehicleMake,
      vehicleModel: job.vehicleModel,
      licensePlate: job.licensePlate,
    });
  };

  return {
    notifyNewJob,
    notifyStatusUpdate,
    notifyNewCustomer,
    notifyJobDeleted,
  };
}
