import { useState } from 'react';
import { useCrmStore } from '../store/crmStore';
import Modal from '../components/Modal';
import { getActivationInstructions, sendWhatsAppNotification } from '../utils/whatsapp';
import {
  Settings as SettingsIcon,
  Building,
  Palette,
  ListOrdered,
  Plus,
  Edit2,
  Trash2,
  GripVertical,
  Download,
  Upload,
  AlertTriangle,
  MessageCircle,
  Bell,
  CheckCircle2,
  Send
} from 'lucide-react';

function Settings() {
  const settings = useCrmStore((state) => state.settings);
  const statuses = useCrmStore((state) => state.statuses);
  const updateSettings = useCrmStore((state) => state.updateSettings);
  const addStatus = useCrmStore((state) => state.addStatus);
  const updateStatus = useCrmStore((state) => state.updateStatus);
  const deleteStatus = useCrmStore((state) => state.deleteStatus);
  const jobs = useCrmStore((state) => state.jobs);

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState(null);
  const [statusForm, setStatusForm] = useState({ name: '', color: '#6366f1' });
  const [testingWhatsApp, setTestingWhatsApp] = useState(false);
  const [whatsAppTestResult, setWhatsAppTestResult] = useState(null);

  // WhatsApp settings helper
  const whatsapp = settings.whatsapp || {
    enabled: false,
    phone: '',
    apiKey: '',
    notifyNewJob: true,
    notifyStatusChange: true,
    notifyJobComplete: true,
    notifyNewCustomer: false,
  };

  const updateWhatsAppSettings = (updates) => {
    updateSettings({
      whatsapp: { ...whatsapp, ...updates }
    });
  };

  const handleTestWhatsApp = async () => {
    if (!whatsapp.phone || !whatsapp.apiKey) {
      setWhatsAppTestResult({ success: false, message: 'Please enter phone and API key first' });
      return;
    }

    setTestingWhatsApp(true);
    setWhatsAppTestResult(null);

    try {
      const message = `✅ *AutoMod Pro CRM*
━━━━━━━━━━━━━━━
Test notification successful!
Your WhatsApp notifications are configured correctly.
━━━━━━━━━━━━━━━
📅 ${new Date().toLocaleString()}`;

      await sendWhatsAppNotification(whatsapp.phone, whatsapp.apiKey, message);
      setWhatsAppTestResult({ success: true, message: 'Test sent! Check your WhatsApp.' });
    } catch (error) {
      setWhatsAppTestResult({ success: false, message: 'Failed to send test message' });
    }

    setTestingWhatsApp(false);
  };

  const colorOptions = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b',
    '#22c55e', '#14b8a6', '#3b82f6', '#64748b', '#a855f7'
  ];

  const handleStatusSubmit = (e) => {
    e.preventDefault();
    
    if (editingStatus) {
      updateStatus(editingStatus.id, statusForm);
    } else {
      const maxOrder = Math.max(...statuses.map(s => s.order || 0), 0);
      addStatus({ ...statusForm, order: maxOrder + 1 });
    }

    setIsStatusModalOpen(false);
    setEditingStatus(null);
    setStatusForm({ name: '', color: '#6366f1' });
  };

  const handleStatusDelete = (id) => {
    // Check if status is used in any jobs
    const usedInJobs = jobs.some(job => job.status === id);
    if (usedInJobs) {
      alert('This status is used in existing jobs. Please update those jobs first before deleting this status.');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this status?')) {
      deleteStatus(id);
    }
  };

  const handleExportData = () => {
    const data = {
      jobs: useCrmStore.getState().jobs,
      customers: useCrmStore.getState().customers,
      services: useCrmStore.getState().services,
      statuses: useCrmStore.getState().statuses,
      settings: useCrmStore.getState().settings,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crm-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        
        if (window.confirm('This will replace all existing data. Are you sure you want to continue?')) {
          // Reset the store with imported data
          localStorage.setItem('crm-storage', JSON.stringify({
            state: {
              jobs: data.jobs || [],
              customers: data.customers || [],
              services: data.services || [],
              statuses: data.statuses || [],
              settings: data.settings || {}
            },
            version: 0
          }));
          
          window.location.reload();
        }
      } catch (error) {
        alert('Invalid backup file. Please select a valid JSON backup.');
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = () => {
    if (window.confirm('⚠️ WARNING: This will permanently delete ALL your data including jobs, customers, and services. This action cannot be undone. Are you absolutely sure?')) {
      if (window.confirm('Please confirm one more time. All data will be lost forever.')) {
        localStorage.removeItem('crm-storage');
        window.location.reload();
      }
    }
  };

  return (
    <>
      <header className="page-header">
        <div className="page-title">
          <h1>Settings</h1>
          <p>Configure your CRM preferences and workflow</p>
        </div>
      </header>

      <div className="page-content">
        <div className="grid-2">
          {/* Business Settings */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building size={18} />
                Business Settings
              </h3>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Business Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={settings.businessName || ''}
                  onChange={(e) => updateSettings({ businessName: e.target.value })}
                  placeholder="Your Business Name"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Currency</label>
                <select
                  className="form-select"
                  value={settings.currency || 'USD'}
                  onChange={(e) => updateSettings({ currency: e.target.value })}
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="AED">AED (د.إ)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Appearance */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Palette size={18} />
                Appearance
              </h3>
            </div>
            <div className="card-body">
              <div className="setting-item" style={{ borderBottom: 'none', padding: '0' }}>
                <div className="setting-info">
                  <h4>Theme</h4>
                  <p>Currently using dark theme (optimized for garage environment)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* WhatsApp Notifications */}
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div className="card-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageCircle size={18} style={{ color: '#25D366' }} />
              WhatsApp Notifications
            </h3>
            <label className="toggle">
              <input
                type="checkbox"
                checked={whatsapp.enabled}
                onChange={(e) => updateWhatsAppSettings({ enabled: e.target.checked })}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          <div className="card-body">
            {/* Setup Instructions */}
            <div style={{
              padding: '1rem',
              background: 'rgba(37, 211, 102, 0.1)',
              border: '1px solid rgba(37, 211, 102, 0.3)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Bell size={16} style={{ color: '#25D366' }} />
                <strong style={{ color: '#25D366' }}>How to activate WhatsApp notifications:</strong>
              </div>
              <ol style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', paddingLeft: '1.25rem', margin: 0 }}>
                <li style={{ marginBottom: '0.5rem' }}>Save this contact in your phone: <strong>+34 644 71 98 30</strong></li>
                <li style={{ marginBottom: '0.5rem' }}>Send this exact message to that number: <code style={{ background: 'var(--bg-tertiary)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>I allow callmebot to send me messages</code></li>
                <li style={{ marginBottom: '0.5rem' }}>You'll receive your API key in the reply</li>
                <li>Enter your phone number (with country code) and API key below</li>
              </ol>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Your Phone Number</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="+919876543210"
                  value={whatsapp.phone}
                  onChange={(e) => updateWhatsAppSettings({ phone: e.target.value })}
                />
                <small style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                  Include country code (e.g., +91 for India, +1 for USA)
                </small>
              </div>
              <div className="form-group">
                <label className="form-label">API Key</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Your CallMeBot API key"
                  value={whatsapp.apiKey}
                  onChange={(e) => updateWhatsAppSettings({ apiKey: e.target.value })}
                />
              </div>
            </div>

            {/* Test Button */}
            <div style={{ marginBottom: '1.5rem' }}>
              <button
                className="btn btn-secondary"
                onClick={handleTestWhatsApp}
                disabled={testingWhatsApp || !whatsapp.phone || !whatsapp.apiKey}
              >
                <Send size={16} />
                {testingWhatsApp ? 'Sending...' : 'Send Test Message'}
              </button>
              {whatsAppTestResult && (
                <span style={{
                  marginLeft: '1rem',
                  fontSize: '0.85rem',
                  color: whatsAppTestResult.success ? 'var(--success)' : 'var(--error)'
                }}>
                  {whatsAppTestResult.success && <CheckCircle2 size={14} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />}
                  {whatsAppTestResult.message}
                </span>
              )}
            </div>

            {/* Notification Preferences */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                NOTIFICATION TRIGGERS
              </div>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                  <div>
                    <div style={{ fontWeight: '500' }}>New Job Created</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Get notified when a new job is added</div>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={whatsapp.notifyNewJob}
                      onChange={(e) => updateWhatsAppSettings({ notifyNewJob: e.target.checked })}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                  <div>
                    <div style={{ fontWeight: '500' }}>Status Updates</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Get notified when job status changes</div>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={whatsapp.notifyStatusChange}
                      onChange={(e) => updateWhatsAppSettings({ notifyStatusChange: e.target.checked })}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                  <div>
                    <div style={{ fontWeight: '500' }}>Job Completed</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Get notified when a job is marked as delivered</div>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={whatsapp.notifyJobComplete}
                      onChange={(e) => updateWhatsAppSettings({ notifyJobComplete: e.target.checked })}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                  <div>
                    <div style={{ fontWeight: '500' }}>New Customer</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Get notified when a new customer is added</div>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={whatsapp.notifyNewCustomer}
                      onChange={(e) => updateWhatsAppSettings({ notifyNewCustomer: e.target.checked })}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Status Management */}
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div className="card-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ListOrdered size={18} />
              Job Statuses
            </h3>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setEditingStatus(null);
                setStatusForm({ name: '', color: '#6366f1' });
                setIsStatusModalOpen(true);
              }}
            >
              <Plus size={16} />
              Add Status
            </button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div style={{ padding: '0.5rem 1rem', background: 'var(--bg-tertiary)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              These statuses define the workflow stages for your jobs. Drag to reorder.
            </div>
            {statuses.sort((a, b) => (a.order || 0) - (b.order || 0)).map((status, index) => (
              <div 
                key={status.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem 1.5rem',
                  borderBottom: index < statuses.length - 1 ? '1px solid var(--border-color)' : 'none'
                }}
              >
                <GripVertical size={16} style={{ color: 'var(--text-muted)', cursor: 'grab' }} />
                <span 
                  style={{ 
                    width: 16, 
                    height: 16, 
                    borderRadius: '4px', 
                    background: status.color 
                  }} 
                />
                <span style={{ flex: 1, fontWeight: '500' }}>{status.name}</span>
                <span style={{ 
                  fontSize: '0.75rem', 
                  color: 'var(--text-muted)',
                  background: 'var(--bg-tertiary)',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px'
                }}>
                  Order: {status.order || index + 1}
                </span>
                <div className="actions-cell">
                  <button 
                    className="btn btn-ghost btn-sm btn-icon"
                    onClick={() => {
                      setEditingStatus(status);
                      setStatusForm({ name: status.name, color: status.color });
                      setIsStatusModalOpen(true);
                    }}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    className="btn btn-ghost btn-sm btn-icon"
                    onClick={() => handleStatusDelete(status.id)}
                    style={{ color: 'var(--error)' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data Management */}
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div className="card-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <SettingsIcon size={18} />
              Data Management
            </h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={handleExportData}>
                <Download size={18} />
                Export All Data
              </button>
              <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                <Upload size={18} />
                Import Data
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            <div style={{ 
              padding: '1rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                marginBottom: '0.5rem',
                color: 'var(--error)'
              }}>
                <AlertTriangle size={18} />
                <strong>Danger Zone</strong>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Clear all data from the system. This action is irreversible and will delete all jobs, customers, and services.
              </p>
              <button className="btn btn-danger" onClick={handleClearData}>
                <Trash2 size={16} />
                Clear All Data
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Status Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => {
          setIsStatusModalOpen(false);
          setEditingStatus(null);
        }}
        title={editingStatus ? 'Edit Status' : 'Add Status'}
      >
        <form onSubmit={handleStatusSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Status Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., In Review"
                value={statusForm.name}
                onChange={(e) => setStatusForm({ ...statusForm, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Color</label>
              <div className="color-picker">
                {colorOptions.map(color => (
                  <button
                    key={color}
                    type="button"
                    className={`color-option ${statusForm.color === color ? 'selected' : ''}`}
                    style={{ background: color }}
                    onClick={() => setStatusForm({ ...statusForm, color })}
                  />
                ))}
              </div>
            </div>
            {editingStatus && (
              <div className="form-group">
                <label className="form-label">Order</label>
                <input
                  type="number"
                  className="form-input"
                  value={editingStatus.order || 1}
                  onChange={(e) => updateStatus(editingStatus.id, { order: parseInt(e.target.value) })}
                  min="1"
                />
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => {
                setIsStatusModalOpen(false);
                setEditingStatus(null);
              }}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingStatus ? 'Update Status' : 'Add Status'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export default Settings;
