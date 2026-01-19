import { useCrmStore } from '../store/crmStore';
import { isSupabaseConfigured, testConnection } from '../lib/supabase';
import {
  jobsService,
  customersService,
  servicesService,
  statusesService,
  leadsService,
  invoicesService,
  estimatesService,
  expensesService,
  paymentsService,
  tasksService,
  ticketsService,
  settingsService,
  syncAllData,
  loadAllData,
} from './supabaseService';

class SyncManager {
  constructor() {
    this.subscriptions = [];
    this.isSyncing = false;
    this.lastSyncTime = null;
    this.syncInterval = null;
  }

  // Initialize sync manager
  async initialize() {
    if (!isSupabaseConfigured()) {
      console.log('Supabase not configured, using local storage only');
      return { success: false, message: 'Supabase not configured' };
    }

    // Test connection
    const connectionTest = await testConnection();
    if (!connectionTest.success) {
      return connectionTest;
    }

    // Load data from Supabase
    await this.loadFromSupabase();

    // Set up real-time subscriptions
    this.setupRealtimeSubscriptions();

    // Set up auto-sync
    this.setupAutoSync();

    return { success: true, message: 'Sync manager initialized' };
  }

  // Load all data from Supabase
  async loadFromSupabase() {
    if (!isSupabaseConfigured()) return;

    try {
      const result = await loadAllData();
      if (result.success && result.data) {
        // Update store with Supabase data
        useCrmStore.setState({
          jobs: result.data.jobs || [],
          customers: result.data.customers || [],
          services: result.data.services || [],
          statuses: result.data.statuses || [],
          leads: result.data.leads || [],
          invoices: result.data.invoices || [],
          estimates: result.data.estimates || [],
          expenses: result.data.expenses || [],
          payments: result.data.payments || [],
          tasks: result.data.tasks || [],
          tickets: result.data.tickets || [],
          settings: result.data.settings || useCrmStore.getState().settings,
        });
        this.lastSyncTime = new Date();
        console.log('Data loaded from Supabase');
      }
    } catch (error) {
      console.error('Failed to load data from Supabase:', error);
    }
  }

  // Sync local data to Supabase
  async syncToSupabase() {
    if (!isSupabaseConfigured() || this.isSyncing) return;

    this.isSyncing = true;
    try {
      const state = useCrmStore.getState();
      const result = await syncAllData({
        jobs: state.jobs,
        customers: state.customers,
        services: state.services,
        statuses: state.statuses,
        leads: state.leads,
        invoices: state.invoices,
        estimates: state.estimates,
        expenses: state.expenses,
        payments: state.payments,
        tasks: state.tasks,
        tickets: state.tickets,
        settings: state.settings,
      });

      if (result.success) {
        this.lastSyncTime = new Date();
        console.log('Data synced to Supabase');
      }
      return result;
    } catch (error) {
      console.error('Failed to sync to Supabase:', error);
      return { success: false, message: error.message };
    } finally {
      this.isSyncing = false;
    }
  }

  // Set up real-time subscriptions
  setupRealtimeSubscriptions() {
    if (!isSupabaseConfigured()) return;

    // Subscribe to changes
    const subscriptions = [
      jobsService.subscribe(this.handleRealtimeChange('jobs')),
      customersService.subscribe(this.handleRealtimeChange('customers')),
      servicesService.subscribe(this.handleRealtimeChange('services')),
      statusesService.subscribe(this.handleRealtimeChange('statuses')),
      leadsService.subscribe(this.handleRealtimeChange('leads')),
      invoicesService.subscribe(this.handleRealtimeChange('invoices')),
      estimatesService.subscribe(this.handleRealtimeChange('estimates')),
      expensesService.subscribe(this.handleRealtimeChange('expenses')),
      paymentsService.subscribe(this.handleRealtimeChange('payments')),
      tasksService.subscribe(this.handleRealtimeChange('tasks')),
      ticketsService.subscribe(this.handleRealtimeChange('tickets')),
      settingsService.subscribe(this.handleRealtimeChange('settings')),
    ];

    this.subscriptions = subscriptions.filter(Boolean);
  }

  // Handle real-time changes
  handleRealtimeChange = (table) => (payload) => {
    const state = useCrmStore.getState();
    const { eventType, new: newRecord, old: oldRecord } = payload;

    switch (eventType) {
      case 'INSERT':
        // Add new record
        if (table === 'jobs') {
          useCrmStore.setState({ jobs: [...state.jobs, newRecord] });
        } else if (table === 'customers') {
          useCrmStore.setState({ customers: [...state.customers, newRecord] });
        } else if (table === 'services') {
          useCrmStore.setState({ services: [...state.services, newRecord] });
        } else if (table === 'statuses') {
          useCrmStore.setState({ statuses: [...state.statuses, newRecord] });
        } else if (table === 'leads') {
          useCrmStore.setState({ leads: [...state.leads, newRecord] });
        } else if (table === 'invoices') {
          useCrmStore.setState({ invoices: [...state.invoices, newRecord] });
        } else if (table === 'estimates') {
          useCrmStore.setState({ estimates: [...state.estimates, newRecord] });
        } else if (table === 'expenses') {
          useCrmStore.setState({ expenses: [...state.expenses, newRecord] });
        } else if (table === 'payments') {
          useCrmStore.setState({ payments: [...state.payments, newRecord] });
        } else if (table === 'tasks') {
          useCrmStore.setState({ tasks: [...state.tasks, newRecord] });
        } else if (table === 'tickets') {
          useCrmStore.setState({ tickets: [...state.tickets, newRecord] });
        } else if (table === 'settings') {
          if (newRecord.id === 'main') {
            useCrmStore.setState({ settings: newRecord.settings });
          }
        }
        break;

      case 'UPDATE':
        // Update existing record
        if (table === 'jobs') {
          useCrmStore.setState({
            jobs: state.jobs.map((item) => (item.id === newRecord.id ? newRecord : item)),
          });
        } else if (table === 'customers') {
          useCrmStore.setState({
            customers: state.customers.map((item) => (item.id === newRecord.id ? newRecord : item)),
          });
        } else if (table === 'services') {
          useCrmStore.setState({
            services: state.services.map((item) => (item.id === newRecord.id ? newRecord : item)),
          });
        } else if (table === 'statuses') {
          useCrmStore.setState({
            statuses: state.statuses.map((item) => (item.id === newRecord.id ? newRecord : item)),
          });
        } else if (table === 'leads') {
          useCrmStore.setState({
            leads: state.leads.map((item) => (item.id === newRecord.id ? newRecord : item)),
          });
        } else if (table === 'invoices') {
          useCrmStore.setState({
            invoices: state.invoices.map((item) => (item.id === newRecord.id ? newRecord : item)),
          });
        } else if (table === 'estimates') {
          useCrmStore.setState({
            estimates: state.estimates.map((item) => (item.id === newRecord.id ? newRecord : item)),
          });
        } else if (table === 'expenses') {
          useCrmStore.setState({
            expenses: state.expenses.map((item) => (item.id === newRecord.id ? newRecord : item)),
          });
        } else if (table === 'payments') {
          useCrmStore.setState({
            payments: state.payments.map((item) => (item.id === newRecord.id ? newRecord : item)),
          });
        } else if (table === 'tasks') {
          useCrmStore.setState({
            tasks: state.tasks.map((item) => (item.id === newRecord.id ? newRecord : item)),
          });
        } else if (table === 'tickets') {
          useCrmStore.setState({
            tickets: state.tickets.map((item) => (item.id === newRecord.id ? newRecord : item)),
          });
        } else if (table === 'settings') {
          if (newRecord.id === 'main') {
            useCrmStore.setState({ settings: newRecord.settings });
          }
        }
        break;

      case 'DELETE':
        // Remove deleted record
        if (table === 'jobs') {
          useCrmStore.setState({ jobs: state.jobs.filter((item) => item.id !== oldRecord.id) });
        } else if (table === 'customers') {
          useCrmStore.setState({ customers: state.customers.filter((item) => item.id !== oldRecord.id) });
        } else if (table === 'services') {
          useCrmStore.setState({ services: state.services.filter((item) => item.id !== oldRecord.id) });
        } else if (table === 'statuses') {
          useCrmStore.setState({ statuses: state.statuses.filter((item) => item.id !== oldRecord.id) });
        } else if (table === 'leads') {
          useCrmStore.setState({ leads: state.leads.filter((item) => item.id !== oldRecord.id) });
        } else if (table === 'invoices') {
          useCrmStore.setState({ invoices: state.invoices.filter((item) => item.id !== oldRecord.id) });
        } else if (table === 'estimates') {
          useCrmStore.setState({ estimates: state.estimates.filter((item) => item.id !== oldRecord.id) });
        } else if (table === 'expenses') {
          useCrmStore.setState({ expenses: state.expenses.filter((item) => item.id !== oldRecord.id) });
        } else if (table === 'payments') {
          useCrmStore.setState({ payments: state.payments.filter((item) => item.id !== oldRecord.id) });
        } else if (table === 'tasks') {
          useCrmStore.setState({ tasks: state.tasks.filter((item) => item.id !== oldRecord.id) });
        } else if (table === 'tickets') {
          useCrmStore.setState({ tickets: state.tickets.filter((item) => item.id !== oldRecord.id) });
        }
        break;
    }
  };

  // Set up auto-sync (every 30 seconds)
  setupAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      this.syncToSupabase();
    }, 30000); // Sync every 30 seconds
  }

  // Manual sync
  async manualSync() {
    return await this.syncToSupabase();
  }

  // Cleanup
  cleanup() {
    this.subscriptions.forEach((sub) => {
      if (sub && sub.unsubscribe) {
        sub.unsubscribe();
      }
    });
    this.subscriptions = [];

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Get sync status
  getStatus() {
    return {
      isConfigured: isSupabaseConfigured(),
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
      subscriptions: this.subscriptions.length,
    };
  }
}

// Export singleton instance
export const syncManager = new SyncManager();
