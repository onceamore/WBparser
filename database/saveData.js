const Day = require("./schemas/Day");
const mongoose = require('mongoose');

async function connectDatabase() {
  try {
    await mongoose.connect('mongodb://localhost:27027/WBAdv', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

async function closeDatabase() {
  try {
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
  }
}

module.exports = { connectDatabase, closeDatabase };

