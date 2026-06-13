const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Ticket = require('../models/Ticket');

// GET /api/dashboard/metrics?days=30
router.get('/metrics', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;

    const now = new Date();
    const periodStart = new Date();
    periodStart.setDate(now.getDate() - days);

    // Previous period for trend comparison (e.g. last 30 days vs the 30 days before that)
    const prevPeriodStart = new Date();
    prevPeriodStart.setDate(now.getDate() - days * 2);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // --- Current period revenue ---
    const currentRevenueAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: periodStart } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const currentRevenue = currentRevenueAgg.length > 0 ? currentRevenueAgg[0].total : 0;

    // --- Previous period revenue (for trend) ---
    const prevRevenueAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: prevPeriodStart, $lt: periodStart } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const prevRevenue = prevRevenueAgg.length > 0 ? prevRevenueAgg[0].total : 0;

    // --- Orders today vs yesterday ---
    const ordersToday = await Order.countDocuments({ createdAt: { $gte: today } });
    const ordersYesterday = await Order.countDocuments({ createdAt: { $gte: yesterday, $lt: today } });

    // --- Pending shipments current vs previous ---
    const pendingShipments = await Order.countDocuments({ status: 'Pending' });
    const totalOrders = await Order.countDocuments();

    // --- Urgent tickets ---
    const urgentTickets = await Ticket.countDocuments({ isUrgent: true, status: { $ne: 'Resolved' } });
    const totalTickets = await Ticket.countDocuments({ status: { $ne: 'Resolved' } });

    // --- Compute trend percentages ---
    const calcTrend = (current, previous) => {
      if (previous === 0) return current > 0 ? '+100' : '0';
      const change = ((current - previous) / previous) * 100;
      return (change >= 0 ? '+' : '') + change.toFixed(1);
    };

    const revenueTrend = calcTrend(currentRevenue, prevRevenue);
    const ordersTrend = calcTrend(ordersToday, ordersYesterday);
    const pendingPercent = totalOrders > 0 
      ? ((pendingShipments / totalOrders) * 100).toFixed(1)
      : '0';
    const urgentPercent = totalTickets > 0 
      ? ((urgentTickets / totalTickets) * 100).toFixed(1) 
      : '0';

    // --- Daily sales chart data for the selected period ---
    const tzOffset = -new Date().getTimezoneOffset();
    const sign = tzOffset >= 0 ? '+' : '-';
    const pad = (num) => String(Math.abs(num)).padStart(2, '0');
    const tzString = `${sign}${pad(Math.floor(tzOffset / 60))}:${pad(tzOffset % 60)}`;

    const dailySales = await Order.aggregate([
      { $match: { createdAt: { $gte: periodStart } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: tzString } },
          sales: { $sum: '$totalAmount' },
          ordersCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Build a full array with zero-filled gaps for days with no orders
    const chartData = [];
    const cursor = new Date(periodStart);
    while (cursor <= now) {
      const year = cursor.getFullYear();
      const month = String(cursor.getMonth() + 1).padStart(2, '0');
      const day = String(cursor.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      let dayLabel;
      if (days <= 7) {
        dayLabel = cursor.toLocaleDateString('en-US', { weekday: 'short' });
      } else {
        // Show "Jun 1" on the 1st of each month or first data point, otherwise just the day number
        const dayNum = cursor.getDate();
        const monthStr = months[cursor.getMonth()];
        if (dayNum === 1 || chartData.length === 0) {
          dayLabel = `${monthStr} ${dayNum}`;
        } else {
          dayLabel = dayNum.toString();
        }
      }
      const match = dailySales.find(d => d._id === dateStr);
      chartData.push({
        name: dayLabel,
        sales: match ? Math.round(match.sales) : 0,
        orders: match ? match.ordersCount : 0
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    res.json({
      metrics: {
        totalRevenue: Math.round(currentRevenue),
        ordersToday,
        pendingShipments,
        urgentTickets,
        revenueTrend,
        ordersTrend,
        pendingPercent,
        urgentPercent
      },
      chartData
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching metrics' });
  }
});

module.exports = router;
