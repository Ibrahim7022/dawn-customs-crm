import { useCrmStore } from '../store/crmStore';
import { sendWhatsAppNotification, formatJobNotification } from '../utils/whatsapp';

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
    await sendNotification('new_job', {
      vehicleMake: job.vehicleMake,
      vehicleModel: job.vehicleModel,
      licensePlate: job.licensePlate,
      customerName: getCustomerName(job.customerId),
      status: getStatusName(job.status),
    });
  };

  const notifyStatusUpdate = async (job, oldStatus, newStatus, note) => {
    const isCompleted = newStatus === 'delivered';
    
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
