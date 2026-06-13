require('dotenv').config();
const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const bcrypt = require('bcrypt');

const User = require('./models/User');
const Order = require('./models/Order');
const Ticket = require('./models/Ticket');

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected! Purging old data...');

    await User.deleteMany({});
    await Order.deleteMany({});
    await Ticket.deleteMany({});

    console.log('Seeding 1 Admin User...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await User.create({
      email: 'alihassaan435@gmail.com',
      password: hashedPassword,
      role: 'admin'
    });

    console.log('Seeding 1,000 Fake Users (Customers)...');
    const fakeUsers = [];
    for (let i = 0; i < 1000; i++) {
      fakeUsers.push({
        email: faker.internet.email(),
        password: hashedPassword,
        role: 'customer'
      });
    }
    await User.insertMany(fakeUsers);

    console.log('Seeding 5,000 Fake Orders (Past 12 months)...');
    const fakeOrders = [];
    for (let i = 0; i < 5000; i++) {
      const statuses = ['Pending', 'Shipped', 'Delivered'];
      fakeOrders.push({
        orderId: `ORD-${faker.string.numeric(6)}`,
        customerEmail: faker.internet.email(),
        totalAmount: parseFloat(faker.commerce.price({ min: 10, max: 500 })),
        status: faker.helpers.arrayElement(statuses),
        createdAt: faker.date.past({ years: 1 })
      });
    }
    await Order.insertMany(fakeOrders);

    console.log('Seeding 200 Support Tickets...');
    const fakeTickets = [];
    const categories = ['Refund', 'Shipping', 'Exchange', 'Product', 'General'];
    const sentiments = ['Furious', 'Frustrated', 'Neutral', 'Happy', 'Thrilled'];
    
    for (let i = 0; i < 200; i++) {
      const sentiment = faker.helpers.arrayElement(sentiments);
      const isUrgent = sentiment === 'Furious' || sentiment === 'Frustrated';
      
      fakeTickets.push({
        ticketId: `TKT-${faker.string.numeric(5)}`,
        customerEmail: faker.internet.email(),
        subject: faker.hacker.phrase(),
        message: faker.lorem.paragraph(),
        category: faker.helpers.arrayElement(categories),
        sentiment,
        isUrgent,
        createdAt: faker.date.recent({ days: 30 })
      });
    }
    await Ticket.insertMany(fakeTickets);

    console.log('🎉 Database seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seedDatabase();
