const mongoose = require('mongoose');

module.exports = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB ^_^")
  } catch (error) {
    console.log("Connenction Failed to MongoDB")
  }
}