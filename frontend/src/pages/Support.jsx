import React, { useState, useEffect } from 'react';
import { Bot, Send, AlertTriangle, User, Clock, ArrowLeft, Sparkles, CheckCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const sentimentColors = {
  Furious: '#ef4444',
  Frustrated: '#f97316',
  Neutral: '#94a3b8',
  Happy: '#10b981',
  Thrilled: '#8b5cf6',
};

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const Support = () => {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMobileDetailView, setIsMobileDetailView] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => { fetchTickets(); }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/tickets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
        if (data.length > 0) setSelectedTicket(data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally { setLoading(false); }
  };

  const handleTicketClick = (ticket) => {
    setSelectedTicket(ticket);
    setReplyText('');
    setIsMobileDetailView(true);
  };

  const handleGenerateReply = async () => {
    setIsGenerating(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/tickets/draft-reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ticketId: selectedTicket.ticketId })
      });
      const data = await res.json();
      if (res.ok && data.reply) {
        setReplyText(data.reply);
      } else {
        setReplyText(data.error || 'Could not generate reply. Please try again.');
      }
    } catch (err) {
      setReplyText('Cannot reach server. Make sure backend is running.');
    } finally { setIsGenerating(false); }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSendReply = async () => {
    if (!replyText || !selectedTicket) return;
    setIsSending(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/tickets/${selectedTicket.ticketId}/resolve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ reply: replyText, status: 'Contacted' })
      });
      if (res.ok) {
        showToast(`Reply sent to ${selectedTicket.customerEmail}`);
        // Remove ticket from list and select next one
        const remaining = tickets.filter(t => t.ticketId !== selectedTicket.ticketId);
        setTickets(remaining);
        setSelectedTicket(remaining.length > 0 ? remaining[0] : null);
        setReplyText('');
        setIsMobileDetailView(remaining.length === 0 ? false : isMobileDetailView);
      } else {
        showToast('Failed to send reply', 'error');
      }
    } catch (err) {
      showToast('Cannot reach server', 'error');
    } finally { setIsSending(false); }
  };

  const sentColor = selectedTicket ? (sentimentColors[selectedTicket.sentiment] || '#94a3b8') : '#94a3b8';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">AI Support Desk</h1>
          <p className="page-subtitle">AI-powered ticket triage and response drafting</p>
        </div>
        <div className="badge badge-shipped ai-pulse flex items-center gap-2" style={{ padding: '8px 16px', fontSize: '14px', borderRadius: '24px' }}>
          <Bot size={18} />
          Gemini AI Active
        </div>
      </div>

      {/* Two-pane layout */}
      <div style={{ display: 'flex', gap: '20px', flex: 1, minHeight: 0, overflow: 'hidden' }}>

        {/* ── Left: Inbox ── */}
        <div
          className={`glass-panel support-list-pane ${isMobileDetailView ? 'mobile-hide-pane' : ''}`}
          style={{ width: '360px', minWidth: '300px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600 }}>Tickets</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{tickets.length} total</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {loading ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>Loading...</div>
            ) : tickets.map((ticket) => {
              const isActive = selectedTicket?.ticketId === ticket.ticketId;
              const color = sentimentColors[ticket.sentiment] || '#94a3b8';
              return (
                <div
                  key={ticket.ticketId}
                  onClick={() => handleTicketClick(ticket)}
                  style={{
                    padding: '14px 20px',
                    borderBottom: '1px solid var(--glass-border)',
                    cursor: 'pointer',
                    background: isActive ? 'rgba(59, 130, 246, 0.06)' : 'transparent',
                    borderLeft: isActive ? '2px solid var(--accent-blue)' : '2px solid transparent',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '190px' }}>
                      {ticket.customerEmail}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{timeAgo(ticket.createdAt)}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ticket.subject}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className={`badge ${ticket.isUrgent ? 'badge-urgent' : 'badge-shipped'}`} style={{
                      boxShadow: ticket.isUrgent ? '0 0 10px rgba(239, 68, 68, 0.4)' : 'none',
                      border: ticket.isUrgent ? '1px solid var(--accent-red)' : '',
                      fontSize: '11px', padding: '3px 8px'
                    }}>
                      {ticket.isUrgent && <AlertTriangle size={10} style={{ marginRight: '4px' }} />}
                      {ticket.sentiment} · {ticket.category}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right: Detail ── */}
        <div
          className={`glass-panel support-detail-pane ${!isMobileDetailView ? 'mobile-hide-pane' : ''}`}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}
        >
          {selectedTicket ? (
            <>
              {/* Top section: customer + message — scrollable */}
              <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                {/* Customer header */}
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)' }}>
                  <button
                    className="glass-button mobile-only"
                    onClick={() => setIsMobileDetailView(false)}
                    style={{ marginBottom: '12px', padding: '6px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <ArrowLeft size={14} /> Back
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '50%',
                      background: `${sentColor}15`, border: `1.5px solid ${sentColor}40`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      <User size={18} color={sentColor} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <h2 style={{ fontSize: '16px', fontWeight: 600 }}>{selectedTicket.customerEmail}</h2>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        <span>{selectedTicket.ticketId}</span>
                        <span style={{ opacity: 0.3 }}>·</span>
                        <Clock size={11} />
                        <span>{timeAgo(selectedTicket.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Meta row */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '12px', fontWeight: 500, padding: '4px 10px', borderRadius: '6px',
                      background: `${sentColor}15`, color: sentColor, border: `1px solid ${sentColor}25`
                    }}>
                      {selectedTicket.sentiment}
                    </span>
                    <span style={{
                      fontSize: '12px', fontWeight: 500, padding: '4px 10px', borderRadius: '6px',
                      background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', border: '1px solid var(--glass-border)'
                    }}>
                      {selectedTicket.category}
                    </span>
                    {selectedTicket.isUrgent && (
                      <span style={{
                        fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px',
                        background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)',
                        display: 'flex', alignItems: 'center', gap: '4px'
                      }}>
                        <AlertTriangle size={11} /> Priority
                      </span>
                    )}
                  </div>
                </div>

                {/* Message body */}
                <div style={{ padding: '20px 24px' }}>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>Subject</p>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>{selectedTicket.subject}</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>Message</p>
                  <div style={{
                    padding: '16px', borderRadius: '10px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--glass-border)',
                    lineHeight: 1.7, fontSize: '14px', color: 'rgba(255,255,255,0.85)'
                  }}>
                    {selectedTicket.message}
                  </div>
                </div>
              </div>

              {/* Bottom section: AI response — fixed at bottom */}
              <div style={{ borderTop: '1px solid var(--glass-border)', padding: '16px 24px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Bot size={15} color="var(--accent-blue)" /> Response
                  </span>
                  <button
                    className="glass-button ai-pulse flex items-center gap-2"
                    onClick={handleGenerateReply}
                    disabled={isGenerating}
                    style={{
                      padding: '8px 18px', fontSize: '13px', fontWeight: 600,
                      animation: isGenerating ? 'none' : undefined,
                    }}
                  >
                    {isGenerating ? (
                      <><Bot size={14} style={{ animation: 'pulse 1s infinite' }} /> Generating...</>
                    ) : (
                      <><Sparkles size={14} /> Draft with AI</>
                    )}
                  </button>
                </div>

                <textarea
                  style={{
                    width: '100%', height: '100px', resize: 'none',
                    padding: '12px', fontSize: '13px', lineHeight: 1.6,
                    fontFamily: 'inherit', borderRadius: '10px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-main)', outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(59,130,246,0.3)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
                  placeholder="Type your reply or use AI to draft one..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    disabled={!replyText || isSending}
                    onClick={handleSendReply}
                    style={{
                      padding: '8px 20px', fontSize: '13px', fontWeight: 600,
                      borderRadius: '8px',
                      background: replyText ? 'var(--accent-blue)' : 'rgba(59,130,246,0.15)',
                      color: replyText ? 'white' : 'rgba(59,130,246,0.5)',
                      border: 'none', cursor: replyText && !isSending ? 'pointer' : 'not-allowed',
                      display: 'flex', alignItems: 'center', gap: '6px',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Send size={13} /> {isSending ? 'Sending...' : 'Send Reply'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
              Select a ticket to view details
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '14px 22px', borderRadius: '12px',
          background: toast.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
          border: `1px solid ${toast.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
          backdropFilter: 'blur(16px)',
          color: toast.type === 'error' ? '#ef4444' : '#10b981',
          fontSize: '14px', fontWeight: 600,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          animation: 'slideIn 0.3s ease',
        }}>
          <CheckCircle size={18} />
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default Support;
