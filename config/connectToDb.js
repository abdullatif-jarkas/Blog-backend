const mongoose = require("mongoose");
const initAdmin = require("../utils/initAdmin");

module.exports = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    initAdmin();
    console.log("Connected to MongoDB ^_^");
  } catch (error) {
    console.log("Connenction Failed to MongoDB");
  }
};
