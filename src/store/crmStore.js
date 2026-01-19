import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

const defaultStatuses = [
  { id: 'received', name: 'Received', color: '#6366f1', order: 1 },
  { id: 'assessment', name: 'Assessment', color: '#f59e0b', order: 2 },
  { id: 'in-progress', name: 'In Progress', color: '#3b82f6', order: 3 },
  { id: 'painting', name: 'Painting', color: '#ec4899', order: 4 },
  { id: 'detailing', name: 'Detailing', color: '#8b5cf6', order: 5 },
  { id: 'quality-check', name: 'Quality Check', color: '#14b8a6', order: 6 },
  { id: 'ready', name: 'Ready for Pickup', color: '#22c55e', order: 7 },
  { id: 'delivered', name: 'Delivered', color: '#64748b', order: 8 },
];

const defaultServices = [
  { id: uuidv4(), name: 'Full Body Wrap', price: 150000, duration: '3-5 days' },
  { id: uuidv4(), name: 'Paint Protection Film', price: 120000, duration: '2-3 days' },
  { id: uuidv4(), name: 'Ceramic Coating', price: 45000, duration: '1-2 days' },
  { id: uuidv4(), name: 'Custom Paint Job', price: 250000, duration: '7-14 days' },
  { id: uuidv4(), name: 'Interior Customization', price: 80000, duration: '3-5 days' },
  { id: uuidv4(), name: 'Wheel Customization', price: 35000, duration: '1-2 days' },
  { id: uuidv4(), name: 'Window Tinting', price: 15000, duration: '1 day' },
  { id: uuidv4(), name: 'Audio System Upgrade', price: 60000, duration: '2-3 days' },
];

const defaultLeadStatuses = [
  { id: 'new', name: 'New', color: '#6366f1', order: 1 },
  { id: 'contacted', name: 'Contacted', color: '#f59e0b', order: 2 },
  { id: 'qualified', name: 'Qualified', color: '#3b82f6', order: 3 },
  { id: 'proposal', name: 'Proposal Sent', color: '#8b5cf6', order: 4 },
  { id: 'negotiation', name: 'Negotiation', color: '#ec4899', order: 5 },
  { id: 'won', name: 'Won', color: '#22c55e', order: 6 },
  { id: 'lost', name: 'Lost', color: '#ef4444', order: 7 },
];

const defaultExpenseCategories = [
  { id: uuidv4(), name: 'Materials & Supplies', color: '#6366f1' },
  { id: uuidv4(), name: 'Equipment', color: '#f59e0b' },
  { id: uuidv4(), name: 'Utilities', color: '#3b82f6' },
  { id: uuidv4(), name: 'Rent', color: '#8b5cf6' },
  { id: uuidv4(), name: 'Salaries', color: '#ec4899' },
  { id: uuidv4(), name: 'Marketing', color: '#14b8a6' },
  { id: uuidv4(), name: 'Transportation', color: '#22c55e' },
  { id: uuidv4(), name: 'Other', color: '#64748b' },
];

const defaultTicketStatuses = [
  { id: 'open', name: 'Open', color: '#3b82f6' },
  { id: 'in-progress', name: 'In Progress', color: '#f59e0b' },
  { id: 'answered', name: 'Answered', color: '#8b5cf6' },
  { id: 'closed', name: 'Closed', color: '#22c55e' },
];

const defaultTicketPriorities = [
  { id: 'low', name: 'Low', color: '#64748b' },
  { id: 'medium', name: 'Medium', color: '#f59e0b' },
  { id: 'high', name: 'High', color: '#ef4444' },
  { id: 'urgent', name: 'Urgent', color: '#dc2626' },
];

export const useCrmStore = create(
  persist(
    (set, get) => ({
      // ============ DATA ============
      jobs: [],
      customers: [],
      statuses: defaultStatuses,
      services: defaultServices,
      
      // New modules
      leads: [],
      leadStatuses: defaultLeadStatuses,
      invoices: [],
      estimates: [],
      expenses: [],
      expenseCategories: defaultExpenseCategories,
      payments: [],
      tasks: [],
      projects: [],
      tickets: [],
      ticketStatuses: defaultTicketStatuses,
      ticketPriorities: defaultTicketPriorities,
      knowledgeBase: [],
      contracts: [],
      events: [],
      staff: [],
      goals: [],
      
      settings: {
        businessName: 'Dawn Customs',
        currency: 'INR',
        theme: 'dark',
        taxRate: 18, // GST
        invoicePrefix: 'INV-',
        estimatePrefix: 'EST-',
        nextInvoiceNumber: 1001,
        nextEstimateNumber: 1001,
        whatsapp: {
          enabled: false,
          phone: '',
          apiKey: '',
          notifyNewJob: true,
          notifyStatusChange: true,
          notifyJobComplete: true,
          notifyNewCustomer: false,
        },
        emailjs: {
          enabled: false,
          serviceId: '',
          templateId: '',
          publicKey: ''
        }
      },

      // ============ AUTHENTICATION ============
      users: [
        {
          id: uuidv4(),
          username: 'admin',
          password: 'admin123', // In production, this should be hashed
          role: 'admin',
          name: 'Administrator',
          email: 'admin@dawncustoms.com',
          createdAt: new Date().toISOString()
        },
        {
          id: uuidv4(),
          username: 'manager',
          password: 'manager123', // In production, this should be hashed
          role: 'manager',
          name: 'Manager',
          email: 'manager@dawncustoms.com',
          createdAt: new Date().toISOString()
        }
      ],
      currentUser: null,

      // ============ JOBS ============
      addJob: (job) => set((state) => ({
        jobs: [...state.jobs, { 
          ...job, 
          id: uuidv4(), 
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          history: [{ 
            status: job.status, 
            date: new Date().toISOString(), 
            note: 'Job created' 
          }]
        }]
      })),

      updateJob: (id, updates) => set((state) => ({
        jobs: state.jobs.map(job => {
          if (job.id === id) {
            const newHistory = updates.status && updates.status !== job.status 
              ? [...(job.history || []), { 
                  status: updates.status, 
                  date: new Date().toISOString(),
                  note: updates.statusNote || `Status changed to ${updates.status}`
                }]
              : job.history;
            return { 
              ...job, 
              ...updates, 
              history: newHistory,
              updatedAt: new Date().toISOString() 
            };
          }
          return job;
        })
      })),

      addJobImage: (jobId, status, imageData) => set((state) => ({
        jobs: state.jobs.map(job => {
          if (job.id === jobId) {
            const images = job.images || {};
            const statusImages = images[status] || [];
            const newImage = {
              id: uuidv4(),
              data: imageData,
              status: status,
              uploadedAt: new Date().toISOString()
            };
            return {
              ...job,
              images: {
                ...images,
                [status]: [...statusImages, newImage]
              },
              updatedAt: new Date().toISOString()
            };
          }
          return job;
        })
      })),

      deleteJobImage: (jobId, status, imageId) => set((state) => ({
        jobs: state.jobs.map(job => {
          if (job.id === jobId) {
            const images = job.images || {};
            const statusImages = images[status] || [];
            return {
              ...job,
              images: {
                ...images,
                [status]: statusImages.filter(img => img.id !== imageId)
              },
              updatedAt: new Date().toISOString()
            };
          }
          return job;
        })
      })),

      deleteJob: (id) => set((state) => ({
        jobs: state.jobs.filter(job => job.id !== id)
      })),

      // ============ CUSTOMERS ============
      addCustomer: (customer) => set((state) => ({
        customers: [...state.customers, { 
          ...customer, 
          id: uuidv4(), 
          createdAt: new Date().toISOString() 
        }]
      })),

      updateCustomer: (id, updates) => set((state) => ({
        customers: state.customers.map(c => 
          c.id === id ? { ...c, ...updates } : c
        )
      })),

      deleteCustomer: (id) => set((state) => ({
        customers: state.customers.filter(c => c.id !== id)
      })),

      // ============ LEADS ============
      addLead: (lead) => set((state) => ({
        leads: [...state.leads, { 
          ...lead, 
          id: uuidv4(), 
          status: lead.status || 'new',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }]
      })),

      updateLead: (id, updates) => set((state) => ({
        leads: state.leads.map(l => 
          l.id === id ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l
        )
      })),

      deleteLead: (id) => set((state) => ({
        leads: state.leads.filter(l => l.id !== id)
      })),

      convertLeadToCustomer: (leadId) => {
        const state = get();
        const lead = state.leads.find(l => l.id === leadId);
        if (lead) {
          const customer = {
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            company: lead.company,
            address: lead.address,
            notes: lead.notes,
            source: 'Converted from lead'
          };
          get().addCustomer(customer);
          set((state) => ({
            leads: state.leads.map(l => 
              l.id === leadId ? { ...l, status: 'won', convertedAt: new Date().toISOString() } : l
            )
          }));
        }
      },

      // ============ INVOICES ============
      addInvoice: (invoice) => set((state) => {
        const invoiceNumber = state.settings.nextInvoiceNumber;
        return {
          invoices: [...state.invoices, { 
            ...invoice, 
            id: uuidv4(),
            invoiceNumber: `${state.settings.invoicePrefix}${invoiceNumber}`,
            status: invoice.status || 'draft',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }],
          settings: {
            ...state.settings,
            nextInvoiceNumber: invoiceNumber + 1
          }
        };
      }),

      updateInvoice: (id, updates) => set((state) => ({
        invoices: state.invoices.map(inv => 
          inv.id === id ? { ...inv, ...updates, updatedAt: new Date().toISOString() } : inv
        )
      })),

      deleteInvoice: (id) => set((state) => ({
        invoices: state.invoices.filter(inv => inv.id !== id)
      })),

      // ============ ESTIMATES ============
      addEstimate: (estimate) => set((state) => {
        const estimateNumber = state.settings.nextEstimateNumber;
        // Generate unique token for public access
        const publicToken = uuidv4().replace(/-/g, '').substring(0, 16);
        return {
          estimates: [...state.estimates, { 
            ...estimate, 
            id: uuidv4(),
            estimateNumber: `${state.settings.estimatePrefix}${estimateNumber}`,
            publicToken, // Unique token for public access
            status: estimate.status || 'draft',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }],
          settings: {
            ...state.settings,
            nextEstimateNumber: estimateNumber + 1
          }
        };
      }),

      updateEstimate: (id, updates) => set((state) => ({
        estimates: state.estimates.map(est => 
          est.id === id ? { ...est, ...updates, updatedAt: new Date().toISOString() } : est
        )
      })),

      deleteEstimate: (id) => set((state) => ({
        estimates: state.estimates.filter(est => est.id !== id)
      })),

      getEstimateByToken: (token) => {
        const state = get();
        return state.estimates.find(e => e.publicToken === token);
      },

      acceptEstimate: (token) => {
        const state = get();
        const estimate = state.estimates.find(e => e.publicToken === token);
        if (estimate) {
          set((state) => ({
            estimates: state.estimates.map(e => 
              e.publicToken === token ? { 
                ...e, 
                status: 'accepted', 
                acceptedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              } : e
            )
          }));
          return true;
        }
        return false;
      },

      declineEstimate: (token) => {
        const state = get();
        const estimate = state.estimates.find(e => e.publicToken === token);
        if (estimate) {
          set((state) => ({
            estimates: state.estimates.map(e => 
              e.publicToken === token ? { 
                ...e, 
                status: 'declined', 
                declinedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              } : e
            )
          }));
          return true;
        }
        return false;
      },

      convertEstimateToInvoice: (estimateId) => {
        const state = get();
        const estimate = state.estimates.find(e => e.id === estimateId);
        if (estimate) {
          const invoice = {
            customerId: estimate.customerId,
            items: estimate.items,
            subtotal: estimate.subtotal,
            tax: estimate.tax,
            total: estimate.total,
            notes: estimate.notes,
            dueDate: estimate.validUntil,
            fromEstimate: estimateId
          };
          get().addInvoice(invoice);
          set((state) => ({
            estimates: state.estimates.map(e => 
              e.id === estimateId ? { ...e, status: 'accepted', convertedAt: new Date().toISOString() } : e
            )
          }));
        }
      },

      // ============ EXPENSES ============
      addExpense: (expense) => set((state) => ({
        expenses: [...state.expenses, { 
          ...expense, 
          id: uuidv4(), 
          createdAt: new Date().toISOString() 
        }]
      })),

      updateExpense: (id, updates) => set((state) => ({
        expenses: state.expenses.map(exp => 
          exp.id === id ? { ...exp, ...updates } : exp
        )
      })),

      deleteExpense: (id) => set((state) => ({
        expenses: state.expenses.filter(exp => exp.id !== id)
      })),

      // ============ PAYMENTS ============
      addPayment: (payment) => set((state) => ({
        payments: [...state.payments, { 
          ...payment, 
          id: uuidv4(), 
          createdAt: new Date().toISOString() 
        }]
      })),

      updatePayment: (id, updates) => set((state) => ({
        payments: state.payments.map(p => 
          p.id === id ? { ...p, ...updates } : p
        )
      })),

      deletePayment: (id) => set((state) => ({
        payments: state.payments.filter(p => p.id !== id)
      })),

      // ============ TASKS ============
      addTask: (task) => set((state) => ({
        tasks: [...state.tasks, { 
          ...task, 
          id: uuidv4(),
          status: task.status || 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }]
      })),

      updateTask: (id, updates) => set((state) => ({
        tasks: state.tasks.map(t => 
          t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
        )
      })),

      deleteTask: (id) => set((state) => ({
        tasks: state.tasks.filter(t => t.id !== id)
      })),

      // ============ PROJECTS ============
      addProject: (project) => set((state) => ({
        projects: [...state.projects, { 
          ...project, 
          id: uuidv4(),
          status: project.status || 'not-started',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }]
      })),

      updateProject: (id, updates) => set((state) => ({
        projects: state.projects.map(p => 
          p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
        )
      })),

      deleteProject: (id) => set((state) => ({
        projects: state.projects.filter(p => p.id !== id)
      })),

      // ============ TICKETS ============
      addTicket: (ticket) => set((state) => ({
        tickets: [...state.tickets, { 
          ...ticket, 
          id: uuidv4(),
          ticketNumber: `TKT-${1000 + state.tickets.length + 1}`,
          status: ticket.status || 'open',
          priority: ticket.priority || 'medium',
          replies: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }]
      })),

      updateTicket: (id, updates) => set((state) => ({
        tickets: state.tickets.map(t => 
          t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
        )
      })),

      addTicketReply: (ticketId, reply) => set((state) => ({
        tickets: state.tickets.map(t => 
          t.id === ticketId ? { 
            ...t, 
            replies: [...(t.replies || []), { ...reply, id: uuidv4(), createdAt: new Date().toISOString() }],
            updatedAt: new Date().toISOString() 
          } : t
        )
      })),

      deleteTicket: (id) => set((state) => ({
        tickets: state.tickets.filter(t => t.id !== id)
      })),

      // ============ KNOWLEDGE BASE ============
      addArticle: (article) => set((state) => ({
        knowledgeBase: [...state.knowledgeBase, { 
          ...article, 
          id: uuidv4(),
          views: 0,
          helpful: 0,
          notHelpful: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }]
      })),

      updateArticle: (id, updates) => set((state) => ({
        knowledgeBase: state.knowledgeBase.map(a => 
          a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
        )
      })),

      deleteArticle: (id) => set((state) => ({
        knowledgeBase: state.knowledgeBase.filter(a => a.id !== id)
      })),

      // ============ CONTRACTS ============
      addContract: (contract) => set((state) => ({
        contracts: [...state.contracts, { 
          ...contract, 
          id: uuidv4(),
          status: contract.status || 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }]
      })),

      updateContract: (id, updates) => set((state) => ({
        contracts: state.contracts.map(c => 
          c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
        )
      })),

      deleteContract: (id) => set((state) => ({
        contracts: state.contracts.filter(c => c.id !== id)
      })),

      // ============ EVENTS ============
      addEvent: (event) => set((state) => ({
        events: [...state.events, { 
          ...event, 
          id: uuidv4(),
          createdAt: new Date().toISOString(),
        }]
      })),

      updateEvent: (id, updates) => set((state) => ({
        events: state.events.map(e => 
          e.id === id ? { ...e, ...updates } : e
        )
      })),

      deleteEvent: (id) => set((state) => ({
        events: state.events.filter(e => e.id !== id)
      })),

      // ============ GOALS ============
      addGoal: (goal) => set((state) => ({
        goals: [...state.goals, { 
          ...goal, 
          id: uuidv4(),
          progress: 0,
          createdAt: new Date().toISOString(),
        }]
      })),

      updateGoal: (id, updates) => set((state) => ({
        goals: state.goals.map(g => 
          g.id === id ? { ...g, ...updates } : g
        )
      })),

      deleteGoal: (id) => set((state) => ({
        goals: state.goals.filter(g => g.id !== id)
      })),

      // ============ STATUSES & SETTINGS ============
      addStatus: (status) => set((state) => ({
        statuses: [...state.statuses, { ...status, id: uuidv4() }]
      })),

      updateStatus: (id, updates) => set((state) => ({
        statuses: state.statuses.map(s => 
          s.id === id ? { ...s, ...updates } : s
        )
      })),

      deleteStatus: (id) => set((state) => ({
        statuses: state.statuses.filter(s => s.id !== id)
      })),

      reorderStatuses: (statuses) => set({ statuses }),

      addService: (service) => set((state) => ({
        services: [...state.services, { ...service, id: uuidv4() }]
      })),

      updateService: (id, updates) => set((state) => ({
        services: state.services.map(s => 
          s.id === id ? { ...s, ...updates } : s
        )
      })),

      deleteService: (id) => set((state) => ({
        services: state.services.filter(s => s.id !== id)
      })),

      updateSettings: (updates) => set((state) => ({
        settings: { ...state.settings, ...updates }
      })),

      // ============ STATS & REPORTS ============
      getStats: () => {
        const state = get();
        const now = new Date();
        const thisMonth = state.jobs.filter(j => {
          const created = new Date(j.createdAt);
          return created.getMonth() === now.getMonth() && 
                 created.getFullYear() === now.getFullYear();
        });
        
        const activeJobs = state.jobs.filter(j => 
          !['delivered', 'ready'].includes(j.status)
        );
        
        const completedThisMonth = thisMonth.filter(j => 
          j.status === 'delivered'
        );
        
        // Calculate revenue from payments
        const paymentsRevenue = state.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
        
        // Calculate revenue from completed jobs
        const completedJobsRevenue = state.jobs
          .filter(j => j.status === 'delivered' && j.totalPrice)
          .reduce((sum, j) => sum + (j.totalPrice || 0), 0);
        
        // Total revenue = payments + completed jobs
        const totalRevenue = paymentsRevenue + completedJobsRevenue;
        
        // Monthly payments revenue
        const monthlyPayments = state.payments.filter(p => {
          const created = new Date(p.createdAt);
          return created.getMonth() === now.getMonth() && 
                 created.getFullYear() === now.getFullYear();
        });
        const monthlyPaymentsRevenue = monthlyPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        
        // Monthly completed jobs revenue
        const monthlyCompletedJobs = state.jobs.filter(j => {
          const completed = j.status === 'delivered';
          if (!completed) return false;
          const updated = new Date(j.updatedAt);
          return updated.getMonth() === now.getMonth() && 
                 updated.getFullYear() === now.getFullYear();
        });
        const monthlyCompletedJobsRevenue = monthlyCompletedJobs.reduce((sum, j) => sum + (j.totalPrice || 0), 0);
        
        // Total monthly revenue
        const monthlyRevenue = monthlyPaymentsRevenue + monthlyCompletedJobsRevenue;

        const totalExpenses = state.expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        
        const monthlyExpenses = state.expenses.filter(e => {
          const created = new Date(e.date || e.createdAt);
          return created.getMonth() === now.getMonth() && 
                 created.getFullYear() === now.getFullYear();
        }).reduce((sum, e) => sum + (e.amount || 0), 0);

        const pendingInvoices = state.invoices.filter(i => i.status === 'sent' || i.status === 'overdue');
        const pendingAmount = pendingInvoices.reduce((sum, i) => sum + (i.total || 0), 0);

        const openTickets = state.tickets.filter(t => t.status === 'open' || t.status === 'in-progress').length;
        const activeLeads = state.leads.filter(l => !['won', 'lost'].includes(l.status)).length;

        return {
          totalJobs: state.jobs.length,
          activeJobs: activeJobs.length,
          completedThisMonth: completedThisMonth.length,
          totalCustomers: state.customers.length,
          monthlyRevenue,
          totalRevenue,
          totalExpenses,
          monthlyExpenses,
          profit: totalRevenue - totalExpenses,
          monthlyProfit: monthlyRevenue - monthlyExpenses,
          pendingInvoices: pendingInvoices.length,
          pendingAmount,
          openTickets,
          activeLeads,
          totalLeads: state.leads.length,
          totalTasks: state.tasks.length,
          pendingTasks: state.tasks.filter(t => t.status !== 'completed').length,
        };
      },

      // ============ AUTH FUNCTIONS ============
      login: (username, password) => {
        const state = get();
        const user = state.users.find(
          u => u.username === username && u.password === password
        );
        
        if (user) {
          set({ currentUser: user });
          return true;
        }
        return false;
      },

      logout: () => {
        set({ currentUser: null });
      },

      addUser: (user) => set((state) => ({
        users: [...state.users, {
          ...user,
          id: uuidv4(),
          createdAt: new Date().toISOString()
        }]
      })),

      updateUser: (id, updates) => set((state) => ({
        users: state.users.map(u => 
          u.id === id ? { ...u, ...updates } : u
        )
      })),

      deleteUser: (id) => set((state) => ({
        users: state.users.filter(u => u.id !== id)
      })),
    }),
    {
      name: 'crm-storage',
    }
  )
);
