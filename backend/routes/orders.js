const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const demoGuard = require('../middleware/demoGuard');

router.get('/', async (req, res) => {
  try {
    const { search, skip = 0, limit = 30 } = req.query;
    const skipNum = parseInt(skip);
    const limitNum = parseInt(limit);
    let query = {};
    
    if (search) {
      query = {
        $or: [
          { customerEmail: { $regex: search, $options: 'i' } },
          { orderId: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const totalCount = await Order.countDocuments(query);
    const orders = await Order.find(query).sort({ createdAt: -1 }).skip(skipNum).limit(limitNum);
    
    res.json({
      orders,
      hasMore: (skipNum + orders.length) < totalCount,
      total: totalCount
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching orders' });
  }
});

// Create a new order
router.post('/', demoGuard, async (req, res) => {
  try {
    const { customerEmail, totalAmount, status } = req.body;

    if (!customerEmail || !totalAmount) {
      return res.status(400).json({ error: 'customerEmail and totalAmount are required' });
    }

    const orderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

    const order = new Order({
      orderId,
      customerEmail,
      totalAmount: parseFloat(totalAmount),
      status: status || 'Pending'
    });

    await order.save();
    res.status(201).json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error creating order' });
  }
});

router.put('/:id', demoGuard, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findOneAndUpdate(
      { orderId: id },
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating order' });
  }
});

module.exports = router;
