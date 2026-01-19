import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { toSupabaseFormat, fromSupabaseFormat } from './dataTransform';

// Generic CRUD operations
const create = async (table, data) => {
  if (!isSupabaseConfigured()) return { data: null, error: { message: 'Supabase not configured' } };
  const transformedData = toSupabaseFormat(data, table);
  const result = await supabase.from(table).insert(transformedData).select().single();
  if (result.data) {
    result.data = fromSupabaseFormat(result.data, table);
  }
  return result;
};

const read = async (table, id = null) => {
  if (!isSupabaseConfigured()) return { data: null, error: { message: 'Supabase not configured' } };
  let result;
  if (id) {
    result = await supabase.from(table).select('*').eq('id', id).single();
  } else {
    result = await supabase.from(table).select('*');
  }
  // Transform snake_case to camelCase
  if (result.data) {
    result.data = fromSupabaseFormat(result.data, table);
  }
  return result;
};

const update = async (table, id, data) => {
  if (!isSupabaseConfigured()) return { data: null, error: { message: 'Supabase not configured' } };
  const transformedData = toSupabaseFormat(data, table);
  const result = await supabase.from(table).update(transformedData).eq('id', id).select().single();
  if (result.data) {
    result.data = fromSupabaseFormat(result.data, table);
  }
  return result;
};

const remove = async (table, id) => {
  if (!isSupabaseConfigured()) return { data: null, error: { message: 'Supabase not configured' } };
  return await supabase.from(table).delete().eq('id', id);
};

const upsert = async (table, data) => {
  if (!isSupabaseConfigured()) return { data: null, error: { message: 'Supabase not configured' } };
  const transformedData = toSupabaseFormat(data, table);
  const result = await supabase.from(table).upsert(transformedData, { onConflict: 'id' }).select();
  if (result.data) {
    result.data = fromSupabaseFormat(result.data, table);
  }
  return result;
};

// Batch operations
const batchCreate = async (table, items) => {
  if (!isSupabaseConfigured()) return { data: null, error: { message: 'Supabase not configured' } };
  return await supabase.from(table).insert(items).select();
};

const batchUpsert = async (table, items) => {
  if (!isSupabaseConfigured()) return { data: null, error: { message: 'Supabase not configured' } };
  // Skip if empty array
  if (!items || items.length === 0) {
    return { data: [], error: null };
  }
  // Transform camelCase to snake_case for Supabase
  const transformedItems = toSupabaseFormat(items, table);
  const result = await supabase.from(table).upsert(transformedItems, { onConflict: 'id' }).select();
  // Transform back to camelCase
  if (result.data) {
    result.data = fromSupabaseFormat(result.data, table);
  }
  return result;
};

// Real-time subscriptions
export const subscribe = (table, callback) => {
  if (!isSupabaseConfigured()) return null;
  
  return supabase
    .channel(`${table}_changes`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
    .subscribe();
};

// ============ SPECIFIC ENTITY OPERATIONS ============

// Jobs
export const jobsService = {
  getAll: () => read('jobs'),
  getById: (id) => read('jobs', id),
  create: (job) => create('jobs', job),
  update: (id, job) => update('jobs', id, job),
  delete: (id) => remove('jobs', id),
  batchUpsert: (jobs) => batchUpsert('jobs', jobs),
  subscribe: (callback) => subscribe('jobs', callback),
};

// Customers
export const customersService = {
  getAll: () => read('customers'),
  getById: (id) => read('customers', id),
  create: (customer) => create('customers', customer),
  update: (id, customer) => update('customers', id, customer),
  delete: (id) => remove('customers', id),
  batchUpsert: (customers) => batchUpsert('customers', customers),
  subscribe: (callback) => subscribe('customers', callback),
};

// Services
export const servicesService = {
  getAll: () => read('services'),
  getById: (id) => read('services', id),
  create: (service) => create('services', service),
  update: (id, service) => update('services', id, service),
  delete: (id) => remove('services', id),
  batchUpsert: (services) => batchUpsert('services', services),
  subscribe: (callback) => subscribe('services', callback),
};

// Statuses
export const statusesService = {
  getAll: () => read('statuses'),
  upsert: (statuses) => batchUpsert('statuses', statuses),
  subscribe: (callback) => subscribe('statuses', callback),
};

// Leads
export const leadsService = {
  getAll: () => read('leads'),
  getById: (id) => read('leads', id),
  create: (lead) => create('leads', lead),
  update: (id, lead) => update('leads', id, lead),
  delete: (id) => remove('leads', id),
  batchUpsert: (leads) => batchUpsert('leads', leads),
  subscribe: (callback) => subscribe('leads', callback),
};

// Invoices
export const invoicesService = {
  getAll: () => read('invoices'),
  getById: (id) => read('invoices', id),
  create: (invoice) => create('invoices', invoice),
  update: (id, invoice) => update('invoices', id, invoice),
  delete: (id) => remove('invoices', id),
  batchUpsert: (invoices) => batchUpsert('invoices', invoices),
  subscribe: (callback) => subscribe('invoices', callback),
};

// Estimates
export const estimatesService = {
  getAll: () => read('estimates'),
  getById: (id) => read('estimates', id),
  create: (estimate) => create('estimates', estimate),
  update: (id, estimate) => update('estimates', id, estimate),
  delete: (id) => remove('estimates', id),
  batchUpsert: (estimates) => batchUpsert('estimates', estimates),
  subscribe: (callback) => subscribe('estimates', callback),
};

// Expenses
export const expensesService = {
  getAll: () => read('expenses'),
  getById: (id) => read('expenses', id),
  create: (expense) => create('expenses', expense),
  update: (id, expense) => update('expenses', id, expense),
  delete: (id) => remove('expenses', id),
  batchUpsert: (expenses) => batchUpsert('expenses', expenses),
  subscribe: (callback) => subscribe('expenses', callback),
};

// Payments
export const paymentsService = {
  getAll: () => read('payments'),
  getById: (id) => read('payments', id),
  create: (payment) => create('payments', payment),
  update: (id, payment) => update('payments', id, payment),
  delete: (id) => remove('payments', id),
  batchUpsert: (payments) => batchUpsert('payments', payments),
  subscribe: (callback) => subscribe('payments', callback),
};

// Tasks
export const tasksService = {
  getAll: () => read('tasks'),
  getById: (id) => read('tasks', id),
  create: (task) => create('tasks', task),
  update: (id, task) => update('tasks', id, task),
  delete: (id) => remove('tasks', id),
  batchUpsert: (tasks) => batchUpsert('tasks', tasks),
  subscribe: (callback) => subscribe('tasks', callback),
};

// Tickets
export const ticketsService = {
  getAll: () => read('tickets'),
  getById: (id) => read('tickets', id),
  create: (ticket) => create('tickets', ticket),
  update: (id, ticket) => update('tickets', id, ticket),
  delete: (id) => remove('tickets', id),
  batchUpsert: (tickets) => batchUpsert('tickets', tickets),
  subscribe: (callback) => subscribe('tickets', callback),
};

// Settings (single record)
export const settingsService = {
  get: async () => {
    if (!isSupabaseConfigured()) return { data: null, error: { message: 'Supabase not configured' } };
    const { data, error } = await supabase.from('settings').select('*').eq('id', 'main').single();
    return { data: data?.settings || null, error };
  },
  update: async (settings) => {
    if (!isSupabaseConfigured()) return { data: null, error: { message: 'Supabase not configured' } };
    return await supabase.from('settings').upsert({ id: 'main', settings, updated_at: new Date().toISOString() }).select().single();
  },
  subscribe: (callback) => subscribe('settings', callback),
};

// Sync all data
export const syncAllData = async (localData) => {
  if (!isSupabaseConfigured()) {
    return { success: false, message: 'Supabase not configured' };
  }

  try {
    // Sync all entities with error tracking
    const syncOperations = [
      { name: 'jobs', promise: batchUpsert('jobs', localData.jobs || []) },
      { name: 'customers', promise: batchUpsert('customers', localData.customers || []) },
      { name: 'services', promise: batchUpsert('services', localData.services || []) },
      { name: 'statuses', promise: batchUpsert('statuses', localData.statuses || []) },
      { name: 'leads', promise: batchUpsert('leads', localData.leads || []) },
      { name: 'invoices', promise: batchUpsert('invoices', localData.invoices || []) },
      { name: 'estimates', promise: batchUpsert('estimates', localData.estimates || []) },
      { name: 'expenses', promise: batchUpsert('expenses', localData.expenses || []) },
      { name: 'payments', promise: batchUpsert('payments', localData.payments || []) },
      { name: 'tasks', promise: batchUpsert('tasks', localData.tasks || []) },
      { name: 'tickets', promise: batchUpsert('tickets', localData.tickets || []) },
    ];

    const syncResults = await Promise.allSettled(syncOperations.map(op => op.promise));

    // Check for errors
    const errors = [];
    syncResults.forEach((result, index) => {
      const operationName = syncOperations[index].name;
      if (result.status === 'rejected') {
        errors.push(`${operationName}: ${result.reason?.message || 'Unknown error'}`);
        console.error(`❌ Failed to sync ${operationName}:`, result.reason);
      } else if (result.value?.error) {
        errors.push(`${operationName}: ${result.value.error.message || 'Unknown error'}`);
        console.error(`❌ Failed to sync ${operationName}:`, result.value.error);
      } else if (result.value?.data) {
        console.log(`✅ Synced ${operationName}: ${result.value.data.length} items`);
      }
    });

    // Sync settings
    if (localData.settings) {
      const settingsResult = await settingsService.update(localData.settings);
      if (settingsResult.error) {
        errors.push(`settings: ${settingsResult.error.message || 'Unknown error'}`);
        console.error('Failed to sync settings:', settingsResult.error);
      }
    }

    if (errors.length > 0) {
      return { 
        success: false, 
        message: `Sync completed with errors: ${errors.join('; ')}`,
        errors 
      };
    }

    return { success: true, message: 'All data synced successfully' };
  } catch (error) {
    console.error('Sync error:', error);
    return { success: false, message: error.message || 'Failed to sync data' };
  }
};

// Load all data from Supabase
export const loadAllData = async () => {
  if (!isSupabaseConfigured()) {
    return { success: false, data: null, message: 'Supabase not configured' };
  }

  try {
    const [
      jobs,
      customers,
      services,
      statuses,
      leads,
      invoices,
      estimates,
      expenses,
      payments,
      tasks,
      tickets,
      settingsResult,
    ] = await Promise.all([
      jobsService.getAll(),
      customersService.getAll(),
      servicesService.getAll(),
      statusesService.getAll(),
      leadsService.getAll(),
      invoicesService.getAll(),
      estimatesService.getAll(),
      expensesService.getAll(),
      paymentsService.getAll(),
      tasksService.getAll(),
      ticketsService.getAll(),
      settingsService.get(),
    ]);

    // Check for errors
    const errors = [
      jobs.error,
      customers.error,
      services.error,
      statuses.error,
      statuses.error,
      leads.error,
      invoices.error,
      estimates.error,
      expenses.error,
      payments.error,
      tasks.error,
      tickets.error,
      settingsResult.error,
    ].filter(Boolean);

    if (errors.length > 0) {
      console.warn('Some data failed to load:', errors);
    }

    return {
      success: true,
      data: {
        jobs: jobs.data || [],
        customers: customers.data || [],
        services: services.data || [],
        statuses: statuses.data || [],
        leads: leads.data || [],
        invoices: invoices.data || [],
        estimates: estimates.data || [],
        expenses: expenses.data || [],
        payments: payments.data || [],
        tasks: tasks.data || [],
        tickets: tickets.data || [],
        settings: settingsResult.data || {},
      },
      message: 'Data loaded successfully',
    };
  } catch (error) {
    return { success: false, data: null, message: error.message || 'Failed to load data' };
  }
};
