const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Ticket = require('../models/Ticket');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');

router.get('/', async (req, res) => {
  try {
    const tickets = await Ticket.find({ status: { $ne: 'Resolved' } }).sort({ isUrgent: -1, createdAt: -1 }).limit(50);
    res.json(tickets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching tickets' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { customer, message } = req.body;
    
    let category = 'General';
    let sentimentRating = 3;
    
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const prompt = `Analyze the following customer support message and return ONLY a valid JSON object with no markdown formatting.
        The JSON should have two fields: "category" (a 1-word category like Refund, Shipping, Exchange, Product, General) and "sentiment" (a number from 1 to 5, where 1 is Furious and 5 is Thrilled).
        
        Message: "${message}"`;
        
        const result = await model.generateContent(prompt);
        let text = result.response.text();
        
        if (text.startsWith('\`\`\`json')) {
          text = text.substring(7, text.length - 3).trim();
        } else if (text.startsWith('\`\`\`')) {
          text = text.substring(3, text.length - 3).trim();
        }
        
        const aiData = JSON.parse(text);
        category = aiData.category || 'General';
        sentimentRating = aiData.sentiment || 3;
      } catch (aiError) {
        console.error('Gemini API Error:', aiError);
      }
    }

    let sentimentLabel = 'Neutral';
    if (sentimentRating <= 2) sentimentLabel = 'Furious';
    if (sentimentRating >= 4) sentimentLabel = 'Happy';

    const isUrgent = sentimentRating <= 2;

    const newTicket = new Ticket({
      ticketId: `TKT-${Math.floor(1000 + Math.random() * 9000)}`,
      customerEmail: customer,
      subject: `Support Request - ${category}`,
      message,
      category,
      sentiment: sentimentLabel,
      isUrgent
    });

    await newTicket.save();
    res.status(201).json(newTicket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error processing webhook' });
  }
});

router.post('/draft-reply', async (req, res) => {
  try {
    const { ticketId } = req.body;
    const ticket = await Ticket.findOne({ ticketId });
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      return res.json({ reply: 'API key not configured. Mock reply: We are looking into this.' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `You are customer support. A user is ${ticket.sentiment.toLowerCase()} about a ${ticket.category.toLowerCase()} issue. 
    Their message is: "${ticket.message}". 
    Draft a polite, professional 3-sentence reply. If they want a refund and are furious, offer a full refund.`;
    
    const result = await model.generateContent(prompt);
    res.json({ reply: result.response.text() });
  } catch (err) {
    console.error('Draft reply error:', err.message);
    const isRateLimit = err.message?.includes('429') || err.message?.includes('quota');
    res.status(isRateLimit ? 429 : 500).json({ 
      error: isRateLimit 
        ? 'Gemini API rate limit reached. Please wait 30 seconds and try again.' 
        : 'Failed to generate AI reply. Please try again.'
    });
  }
});

// Resolve / contact a ticket
router.put('/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const { reply, status } = req.body;

    const newStatus = status || 'Resolved';

    const ticket = await Ticket.findOneAndUpdate(
      { ticketId: id },
      { status: newStatus, reply: reply || '' },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json({ message: `Ticket ${newStatus.toLowerCase()} successfully`, ticket });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error resolving ticket' });
  }
});

module.exports = router;
