const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  ticketId: { type: String, required: true, unique: true },
  customerEmail: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  category: { type: String, default: 'General' },
  sentiment: { type: String, default: 'Neutral' },
  isUrgent: { type: Boolean, default: false },
  status: { type: String, enum: ['Open', 'Contacted', 'Resolved'], default: 'Open' },
  reply: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ticket', ticketSchema);
