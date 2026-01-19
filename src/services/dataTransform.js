// Transform data between local storage format (camelCase) and Supabase format (snake_case)

// Convert camelCase to snake_case for Supabase
export const toSupabaseFormat = (data, tableName) => {
  if (!data || typeof data !== 'object') return data;
  
  if (Array.isArray(data)) {
    return data.map(item => toSupabaseFormat(item, tableName));
  }

  const transformed = { ...data };

  // Common field mappings
  const fieldMappings = {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    customerId: 'customer_id',
    invoiceId: 'invoice_id',
    estimateNumber: 'estimate_number',
    publicToken: 'public_token',
    validUntil: 'valid_until',
    dueDate: 'due_date',
    categoryId: 'category_id',
    assignedTo: 'assigned_to',
    vehicleMake: 'vehicle_make',
    vehicleModel: 'vehicle_model',
    vehicleYear: 'vehicle_year',
    vehicleColor: 'vehicle_color',
    licensePlate: 'license_plate',
    estimatedCompletion: 'estimated_completion',
    totalPrice: 'total_price',
  };

  // Apply field mappings
  Object.keys(fieldMappings).forEach(camelKey => {
    if (transformed[camelKey] !== undefined) {
      transformed[fieldMappings[camelKey]] = transformed[camelKey];
      delete transformed[camelKey];
    }
  });

  return transformed;
};

// Helper function to safely parse and validate dates
const safeDateParse = (dateValue) => {
  if (!dateValue) return null;
  if (dateValue instanceof Date) {
    return isNaN(dateValue.getTime()) ? null : dateValue.toISOString();
  }
  if (typeof dateValue === 'string') {
    const parsed = new Date(dateValue);
    return isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }
  return null;
};

// Convert snake_case to camelCase for local storage
export const fromSupabaseFormat = (data, tableName) => {
  if (!data || typeof data !== 'object') return data;
  
  if (Array.isArray(data)) {
    return data.map(item => fromSupabaseFormat(item, tableName));
  }

  const transformed = { ...data };

  // Reverse field mappings
  const fieldMappings = {
    created_at: 'createdAt',
    updated_at: 'updatedAt',
    customer_id: 'customerId',
    invoice_id: 'invoiceId',
    estimate_number: 'estimateNumber',
    public_token: 'publicToken',
    valid_until: 'validUntil',
    due_date: 'dueDate',
    category_id: 'categoryId',
    assigned_to: 'assignedTo',
    vehicle_make: 'vehicleMake',
    vehicle_model: 'vehicleModel',
    vehicle_year: 'vehicleYear',
    vehicle_color: 'vehicleColor',
    license_plate: 'licensePlate',
    estimated_completion: 'estimatedCompletion',
    total_price: 'totalPrice',
  };

  // Date fields that need validation
  const dateFields = ['created_at', 'updated_at', 'valid_until', 'due_date', 'estimated_completion'];

  // Apply reverse field mappings and validate dates
  Object.keys(fieldMappings).forEach(snakeKey => {
    if (transformed[snakeKey] !== undefined) {
      const camelKey = fieldMappings[snakeKey];
      
      // If it's a date field, validate and sanitize it
      if (dateFields.includes(snakeKey)) {
        transformed[camelKey] = safeDateParse(transformed[snakeKey]);
      } else {
        transformed[camelKey] = transformed[snakeKey];
      }
      
      delete transformed[snakeKey];
    }
  });

  // Also check for any remaining date fields that might have been missed
  dateFields.forEach(dateField => {
    if (transformed[dateField] !== undefined) {
      const camelKey = fieldMappings[dateField] || dateField;
      transformed[camelKey] = safeDateParse(transformed[dateField]);
      delete transformed[dateField];
    }
  });

  return transformed;
};
