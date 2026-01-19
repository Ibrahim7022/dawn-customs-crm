import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Generic CRUD operations
const create = async (table, data) => {
  if (!isSupabaseConfigured()) return { data: null, error: { message: 'Supabase not configured' } };
  return await supabase.from(table).insert(data).select().single();
};

const read = async (table, id = null) => {
  if (!isSupabaseConfigured()) return { data: null, error: { message: 'Supabase not configured' } };
  if (id) {
    return await supabase.from(table).select('*').eq('id', id).single();
  }
  return await supabase.from(table).select('*');
};

const update = async (table, id, data) => {
  if (!isSupabaseConfigured()) return { data: null, error: { message: 'Supabase not configured' } };
  return await supabase.from(table).update(data).eq('id', id).select().single();
};

const remove = async (table, id) => {
  if (!isSupabaseConfigured()) return { data: null, error: { message: 'Supabase not configured' } };
  return await supabase.from(table).delete().eq('id', id);
};

const upsert = async (table, data) => {
  if (!isSupabaseConfigured()) return { data: null, error: { message: 'Supabase not configured' } };
  return await supabase.from(table).upsert(data, { onConflict: 'id' }).select();
};

// Batch operations
const batchCreate = async (table, items) => {
  if (!isSupabaseConfigured()) return { data: null, error: { message: 'Supabase not configured' } };
  return await supabase.from(table).insert(items).select();
};

const batchUpsert = async (table, items) => {
  if (!isSupabaseConfigured()) return { data: null, error: { message: 'Supabase not configured' } };
  return await supabase.from(table).upsert(items, { onConflict: 'id' }).select();
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
    return await supabase.from('settings').upsert({ id: 'main', settings, updatedAt: new Date().toISOString() }).select().single();
  },
  subscribe: (callback) => subscribe('settings', callback),
};

// Sync all data
export const syncAllData = async (localData) => {
  if (!isSupabaseConfigured()) {
    return { success: false, message: 'Supabase not configured' };
  }

  try {
    // Sync all entities
    const syncPromises = [
      batchUpsert('jobs', localData.jobs || []),
      batchUpsert('customers', localData.customers || []),
      batchUpsert('services', localData.services || []),
      batchUpsert('statuses', localData.statuses || []),
      batchUpsert('leads', localData.leads || []),
      batchUpsert('invoices', localData.invoices || []),
      batchUpsert('estimates', localData.estimates || []),
      batchUpsert('expenses', localData.expenses || []),
      batchUpsert('payments', localData.payments || []),
      batchUpsert('tasks', localData.tasks || []),
      batchUpsert('tickets', localData.tickets || []),
    ];

    await Promise.all(syncPromises);

    // Sync settings
    if (localData.settings) {
      await settingsService.update(localData.settings);
    }

    return { success: true, message: 'All data synced successfully' };
  } catch (error) {
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
