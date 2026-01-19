import { useCrmStore } from '../store/crmStore';
import { isSupabaseConfigured, testConnection } from '../lib/supabase';
import { fromSupabaseFormat } from './dataTransform';
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

    // Smart initialization: Check if we should load from Supabase or sync to it
    const state = useCrmStore.getState();
    const hasLocalData = 
      (state.jobs && state.jobs.length > 0) ||
      (state.customers && state.customers.length > 0) ||
      (state.statuses && state.statuses.length > 0) ||
      (state.services && state.services.length > 0);

    if (hasLocalData) {
      // We have local data - sync TO Supabase first to preserve it
      console.log('Local data detected, syncing to Supabase first...');
      await this.syncToSupabase();
    } else {
      // No local data - safe to load from Supabase
      console.log('No local data, loading from Supabase...');
      await this.loadFromSupabase();
    }

    // Set up real-time subscriptions
    this.setupRealtimeSubscriptions();

    // Set up auto-sync
    this.setupAutoSync();

    return { success: true, message: 'Sync manager initialized' };
  }

  // Load all data from Supabase
  async loadFromSupabase(merge = false) {
    if (!isSupabaseConfigured()) return;

    // Sanitize data to handle any invalid dates or values
    const sanitizeData = (data) => {
      if (!data || !Array.isArray(data)) return data || [];
      return data.map(item => {
        if (!item || typeof item !== 'object') return item;
        const sanitized = { ...item };
        
        // Clean up any date fields that might be invalid
        const dateFields = ['createdAt', 'updatedAt', 'validUntil', 'dueDate', 'estimatedCompletion'];
        dateFields.forEach(field => {
          if (sanitized[field]) {
            try {
              const date = new Date(sanitized[field]);
              if (isNaN(date.getTime())) {
                // Invalid date - remove it or set to null
                sanitized[field] = null;
              } else {
                sanitized[field] = date.toISOString();
              }
            } catch (e) {
              sanitized[field] = null;
            }
          }
        });
        
        return sanitized;
      });
    };

    try {
      const result = await loadAllData();
      if (result.success && result.data) {
        const currentState = useCrmStore.getState();
        
        if (merge) {
          // Merge strategy: Combine local and remote data, preferring remote for conflicts
          const mergeArrays = (local, remote, key = 'id') => {
            if (!remote || remote.length === 0) return local || [];
            if (!local || local.length === 0) return sanitizeData(remote) || [];
            
            // Sanitize remote data first
            const sanitizedRemote = sanitizeData(remote);
            
            // Create a map of remote items by ID
            const remoteMap = new Map(sanitizedRemote.map(item => [item[key], item]));
            // Keep local items that don't exist in remote
            const localOnly = (local || []).filter(item => !remoteMap.has(item[key]));
            // Combine: remote items (preferred) + local-only items
            return [...sanitizedRemote, ...localOnly];
          };

          // Update store with merged data
          useCrmStore.setState({
            jobs: mergeArrays(currentState.jobs, result.data.jobs),
            customers: mergeArrays(currentState.customers, result.data.customers),
            services: mergeArrays(currentState.services, result.data.services),
            statuses: mergeArrays(currentState.statuses, result.data.statuses),
            leads: mergeArrays(currentState.leads, result.data.leads),
            invoices: mergeArrays(currentState.invoices, result.data.invoices),
            estimates: mergeArrays(currentState.estimates, result.data.estimates),
            expenses: mergeArrays(currentState.expenses, result.data.expenses),
            payments: mergeArrays(currentState.payments, result.data.payments),
            tasks: mergeArrays(currentState.tasks, result.data.tasks),
            tickets: mergeArrays(currentState.tickets, result.data.tickets),
            settings: result.data.settings || currentState.settings,
          });
          console.log('Data merged from Supabase');
        } else {
          // Replace strategy: Only replace if Supabase has data, otherwise keep local
          const hasSupabaseData = 
            (result.data.jobs && result.data.jobs.length > 0) ||
            (result.data.customers && result.data.customers.length > 0) ||
            (result.data.statuses && result.data.statuses.length > 0) ||
            (result.data.services && result.data.services.length > 0);

          if (hasSupabaseData) {
            // Supabase has data - replace local (with sanitization)
            useCrmStore.setState({
              jobs: sanitizeData(result.data.jobs) || currentState.jobs || [],
              customers: sanitizeData(result.data.customers) || currentState.customers || [],
              services: sanitizeData(result.data.services) || currentState.services || [],
              statuses: sanitizeData(result.data.statuses) || currentState.statuses || [],
              leads: sanitizeData(result.data.leads) || currentState.leads || [],
              invoices: sanitizeData(result.data.invoices) || currentState.invoices || [],
              estimates: sanitizeData(result.data.estimates) || currentState.estimates || [],
              expenses: sanitizeData(result.data.expenses) || currentState.expenses || [],
              payments: sanitizeData(result.data.payments) || currentState.payments || [],
              tasks: sanitizeData(result.data.tasks) || currentState.tasks || [],
              tickets: sanitizeData(result.data.tickets) || currentState.tickets || [],
              settings: result.data.settings || currentState.settings,
            });
            console.log('Data loaded from Supabase (replaced local)');
          } else {
            // Supabase is empty - keep local data
            console.log('Supabase is empty, keeping local data');
          }
        }
        this.lastSyncTime = new Date();
      }
    } catch (error) {
      console.error('Failed to load data from Supabase:', error);
      throw error;
    }
  }

  // Sync local data to Supabase
  async syncToSupabase() {
    if (!isSupabaseConfigured() || this.isSyncing) {
      return { success: false, message: 'Supabase not configured or already syncing' };
    }

    this.isSyncing = true;
    try {
      const state = useCrmStore.getState();
      console.log('Syncing to Supabase:', {
        customers: state.customers.length,
        jobs: state.jobs.length,
        services: state.services.length,
      });
      
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
        console.log('✅ Data synced to Supabase successfully');
      } else {
        console.error('❌ Sync failed:', result.message);
      }
      return result;
    } catch (error) {
      console.error('❌ Failed to sync to Supabase:', error);
      return { success: false, message: error.message || 'Unknown error occurred' };
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

    // Transform data from Supabase format (snake_case to camelCase)
    const transformedNewRecord = newRecord ? fromSupabaseFormat(newRecord, table) : null;
    const transformedOldRecord = oldRecord ? fromSupabaseFormat(oldRecord, table) : null;

    switch (eventType) {
      case 'INSERT':
        // Add new record
        if (table === 'jobs') {
          useCrmStore.setState({ jobs: [...state.jobs, transformedNewRecord] });
        } else if (table === 'customers') {
          useCrmStore.setState({ customers: [...state.customers, transformedNewRecord] });
        } else if (table === 'services') {
          useCrmStore.setState({ services: [...state.services, transformedNewRecord] });
        } else if (table === 'statuses') {
          useCrmStore.setState({ statuses: [...state.statuses, transformedNewRecord] });
        } else if (table === 'leads') {
          useCrmStore.setState({ leads: [...state.leads, transformedNewRecord] });
        } else if (table === 'invoices') {
          useCrmStore.setState({ invoices: [...state.invoices, transformedNewRecord] });
        } else if (table === 'estimates') {
          useCrmStore.setState({ estimates: [...state.estimates, transformedNewRecord] });
        } else if (table === 'expenses') {
          useCrmStore.setState({ expenses: [...state.expenses, transformedNewRecord] });
        } else if (table === 'payments') {
          useCrmStore.setState({ payments: [...state.payments, transformedNewRecord] });
        } else if (table === 'tasks') {
          useCrmStore.setState({ tasks: [...state.tasks, transformedNewRecord] });
        } else if (table === 'tickets') {
          useCrmStore.setState({ tickets: [...state.tickets, transformedNewRecord] });
        } else if (table === 'settings') {
          if (transformedNewRecord?.id === 'main') {
            useCrmStore.setState({ settings: transformedNewRecord.settings });
          }
        }
        break;

      case 'UPDATE':
        // Update existing record
        if (table === 'jobs') {
          useCrmStore.setState({
            jobs: state.jobs.map((item) => (item.id === transformedNewRecord.id ? transformedNewRecord : item)),
          });
        } else if (table === 'customers') {
          useCrmStore.setState({
            customers: state.customers.map((item) => (item.id === transformedNewRecord.id ? transformedNewRecord : item)),
          });
        } else if (table === 'services') {
          useCrmStore.setState({
            services: state.services.map((item) => (item.id === transformedNewRecord.id ? transformedNewRecord : item)),
          });
        } else if (table === 'statuses') {
          useCrmStore.setState({
            statuses: state.statuses.map((item) => (item.id === transformedNewRecord.id ? transformedNewRecord : item)),
          });
        } else if (table === 'leads') {
          useCrmStore.setState({
            leads: state.leads.map((item) => (item.id === transformedNewRecord.id ? transformedNewRecord : item)),
          });
        } else if (table === 'invoices') {
          useCrmStore.setState({
            invoices: state.invoices.map((item) => (item.id === transformedNewRecord.id ? transformedNewRecord : item)),
          });
        } else if (table === 'estimates') {
          useCrmStore.setState({
            estimates: state.estimates.map((item) => (item.id === transformedNewRecord.id ? transformedNewRecord : item)),
          });
        } else if (table === 'expenses') {
          useCrmStore.setState({
            expenses: state.expenses.map((item) => (item.id === transformedNewRecord.id ? transformedNewRecord : item)),
          });
        } else if (table === 'payments') {
          useCrmStore.setState({
            payments: state.payments.map((item) => (item.id === transformedNewRecord.id ? transformedNewRecord : item)),
          });
        } else if (table === 'tasks') {
          useCrmStore.setState({
            tasks: state.tasks.map((item) => (item.id === transformedNewRecord.id ? transformedNewRecord : item)),
          });
        } else if (table === 'tickets') {
          useCrmStore.setState({
            tickets: state.tickets.map((item) => (item.id === transformedNewRecord.id ? transformedNewRecord : item)),
          });
        } else if (table === 'settings') {
          if (transformedNewRecord?.id === 'main') {
            useCrmStore.setState({ settings: transformedNewRecord.settings });
          }
        }
        break;

      case 'DELETE':
        // Remove deleted record
        if (table === 'jobs') {
          useCrmStore.setState({ jobs: state.jobs.filter((item) => item.id !== transformedOldRecord.id) });
        } else if (table === 'customers') {
          useCrmStore.setState({ customers: state.customers.filter((item) => item.id !== transformedOldRecord.id) });
        } else if (table === 'services') {
          useCrmStore.setState({ services: state.services.filter((item) => item.id !== transformedOldRecord.id) });
        } else if (table === 'statuses') {
          useCrmStore.setState({ statuses: state.statuses.filter((item) => item.id !== transformedOldRecord.id) });
        } else if (table === 'leads') {
          useCrmStore.setState({ leads: state.leads.filter((item) => item.id !== transformedOldRecord.id) });
        } else if (table === 'invoices') {
          useCrmStore.setState({ invoices: state.invoices.filter((item) => item.id !== transformedOldRecord.id) });
        } else if (table === 'estimates') {
          useCrmStore.setState({ estimates: state.estimates.filter((item) => item.id !== transformedOldRecord.id) });
        } else if (table === 'expenses') {
          useCrmStore.setState({ expenses: state.expenses.filter((item) => item.id !== transformedOldRecord.id) });
        } else if (table === 'payments') {
          useCrmStore.setState({ payments: state.payments.filter((item) => item.id !== transformedOldRecord.id) });
        } else if (table === 'tasks') {
          useCrmStore.setState({ tasks: state.tasks.filter((item) => item.id !== transformedOldRecord.id) });
        } else if (table === 'tickets') {
          useCrmStore.setState({ tickets: state.tickets.filter((item) => item.id !== transformedOldRecord.id) });
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
