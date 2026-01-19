import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCrmStore } from '../store/crmStore';
import { useCurrency } from '../hooks/useCurrency';
import { format } from 'date-fns';
import { CheckCircle, XCircle, Loader, FileText, Calendar, Check } from 'lucide-react';

function PublicEstimate() {
  const { token } = useParams();
  const navigate = useNavigate();
  const getEstimateByToken = useCrmStore((state) => state.getEstimateByToken);
  const acceptEstimate = useCrmStore((state) => state.acceptEstimate);
  const declineEstimate = useCrmStore((state) => state.declineEstimate);
  const customers = useCrmStore((state) => state.customers);
  const settings = useCrmStore((state) => state.settings);
  const { format: formatCurrency } = useCurrency();

  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (token) {
      const foundEstimate = getEstimateByToken(token);
      setEstimate(foundEstimate);
      setLoading(false);
      
      if (!foundEstimate) {
        setMessage('Estimate not found or link is invalid.');
      }
    }
  }, [token, getEstimateByToken]);

  const handleAccept = async () => {
    if (!window.confirm('Are you sure you want to accept this estimate?')) {
      return;
    }

    setProcessing(true);
    try {
      const success = acceptEstimate(token);
      if (success) {
        setMessage('Estimate accepted successfully! We will contact you soon.');
        setEstimate({ ...estimate, status: 'accepted' });
      } else {
        setMessage('Failed to accept estimate. Please try again.');
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!window.confirm('Are you sure you want to decline this estimate?')) {
      return;
    }

    setProcessing(true);
    try {
      const success = declineEstimate(token);
      if (success) {
        setMessage('Estimate declined. Thank you for your response.');
        setEstimate({ ...estimate, status: 'declined' });
      } else {
        setMessage('Failed to decline estimate. Please try again.');
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || 'Customer';
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)'
      }}>
        <Loader className="spinner" size={32} />
      </div>
    );
  }

  if (!estimate) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        padding: '2rem'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '500px' }}>
          <FileText size={64} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h1 style={{ marginBottom: '1rem' }}>Estimate Not Found</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            {message || 'The estimate link is invalid or has expired.'}
          </p>
        </div>
      </div>
    );
  }

  const isExpired = estimate.validUntil && new Date(estimate.validUntil) < new Date();
  const canRespond = estimate.status === 'sent' && !isExpired;

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      padding: '2rem'
    }}>
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto',
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        padding: '2rem',
        boxShadow: 'var(--shadow-lg)'
      }}>
        {/* Header */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '2rem',
          paddingBottom: '2rem',
          borderBottom: '2px solid var(--border-color)'
        }}>
          <h1 style={{ 
            fontSize: '2rem', 
            marginBottom: '0.5rem',
            color: 'var(--accent-primary)'
          }}>
            {settings.businessName || 'Dawn Customs'}
          </h1>
          <h2 style={{ 
            fontSize: '1.25rem', 
            color: 'var(--text-secondary)',
            fontWeight: 'normal'
          }}>
            Estimate #{estimate.estimateNumber}
          </h2>
        </div>

        {/* Status Badge */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          marginBottom: '2rem' 
        }}>
          {estimate.status === 'accepted' && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: 'var(--success)20',
              color: 'var(--success)',
              borderRadius: 'var(--radius-md)',
              fontWeight: '600'
            }}>
              <CheckCircle size={18} />
              Accepted
            </div>
          )}
          {estimate.status === 'declined' && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: 'var(--error)20',
              color: 'var(--error)',
              borderRadius: 'var(--radius-md)',
              fontWeight: '600'
            }}>
              <XCircle size={18} />
              Declined
            </div>
          )}
          {estimate.status === 'sent' && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: 'var(--info)20',
              color: 'var(--info)',
              borderRadius: 'var(--radius-md)',
              fontWeight: '600'
            }}>
              <FileText size={18} />
              Pending Your Response
            </div>
          )}
        </div>

        {/* Customer Info */}
        <div style={{ 
          background: 'var(--bg-tertiary)', 
          padding: '1rem', 
          borderRadius: 'var(--radius-md)',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                Prepared For
              </div>
              <div style={{ fontWeight: '600' }}>{getCustomerName(estimate.customerId)}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                Valid Until
              </div>
              <div style={{ 
                fontWeight: '600',
                color: isExpired ? 'var(--error)' : 'inherit'
              }}>
                {estimate.validUntil ? format(new Date(estimate.validUntil), 'MMM d, yyyy') : 'N/A'}
                {isExpired && ' (Expired)'}
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Items</h3>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden'
          }}>
            <thead>
              <tr style={{ background: 'var(--bg-elevated)' }}>
                <th style={{ 
                  padding: '0.75rem', 
                  textAlign: 'left', 
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                  fontWeight: '600'
                }}>Description</th>
                <th style={{ 
                  padding: '0.75rem', 
                  textAlign: 'right', 
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                  fontWeight: '600'
                }}>Quantity</th>
                <th style={{ 
                  padding: '0.75rem', 
                  textAlign: 'right', 
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                  fontWeight: '600'
                }}>Rate</th>
                <th style={{ 
                  padding: '0.75rem', 
                  textAlign: 'right', 
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                  fontWeight: '600'
                }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {estimate.items?.map((item, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.75rem' }}>{item.description}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>{item.quantity}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>{formatCurrency(item.rate)}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>
                    {formatCurrency(item.quantity * item.rate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div style={{ 
          background: 'var(--bg-tertiary)', 
          padding: '1.5rem', 
          borderRadius: 'var(--radius-md)',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>Subtotal:</span>
            <span>{formatCurrency(estimate.subtotal || 0)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>Tax ({estimate.taxRate || settings.taxRate || 18}%):</span>
            <span>{formatCurrency(estimate.tax || 0)}</span>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            paddingTop: '1rem',
            borderTop: '2px solid var(--border-color)',
            fontSize: '1.25rem',
            fontWeight: '700',
            color: 'var(--accent-primary)'
          }}>
            <span>Total:</span>
            <span>{formatCurrency(estimate.total || 0)}</span>
          </div>
        </div>

        {/* Notes */}
        {estimate.notes && (
          <div style={{ 
            background: 'var(--bg-tertiary)', 
            padding: '1rem', 
            borderRadius: 'var(--radius-md)',
            marginBottom: '2rem'
          }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Notes:
            </div>
            <div>{estimate.notes}</div>
          </div>
        )}

        {/* Message */}
        {message && (
          <div style={{
            padding: '1rem',
            background: message.includes('success') ? 'var(--success)20' : 'var(--error)20',
            color: message.includes('success') ? 'var(--success)' : 'var(--error)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            {message}
          </div>
        )}

        {/* Action Buttons */}
        {canRespond && (
          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            justifyContent: 'center',
            marginTop: '2rem'
          }}>
            <button
              onClick={handleAccept}
              disabled={processing}
              style={{
                flex: 1,
                padding: '1rem 2rem',
                background: 'var(--success)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: processing ? 'not-allowed' : 'pointer',
                opacity: processing ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {processing ? (
                <>
                  <Loader className="spinner" size={18} />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  Accept Estimate
                </>
              )}
            </button>
            <button
              onClick={handleDecline}
              disabled={processing}
              style={{
                flex: 1,
                padding: '1rem 2rem',
                background: 'var(--error)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: processing ? 'not-allowed' : 'pointer',
                opacity: processing ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {processing ? (
                <>
                  <Loader className="spinner" size={18} />
                  Processing...
                </>
              ) : (
                <>
                  <XCircle size={18} />
                  Decline Estimate
                </>
              )}
            </button>
          </div>
        )}

        {/* Footer */}
        <div style={{ 
          marginTop: '2rem', 
          paddingTop: '2rem', 
          borderTop: '1px solid var(--border-color)',
          textAlign: 'center',
          fontSize: '0.85rem',
          color: 'var(--text-muted)'
        }}>
          <p>Thank you for considering our services!</p>
          <p style={{ marginTop: '0.5rem' }}>
            Created: {format(new Date(estimate.createdAt), 'MMM d, yyyy')}
          </p>
        </div>
      </div>
    </div>
  );
}

export default PublicEstimate;
