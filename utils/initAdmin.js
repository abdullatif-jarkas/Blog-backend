const { User } = require("../models/User");
const bcrypt = require("bcryptjs");

async function initAdmin() {
  try {
    const superAdmin = await User.findOne({ email: "admin@gmail.com" });
    if (superAdmin) {
      console.log("Admin user already exists");
    } else {
      const hashedPassword = await bcrypt.hash("admin123", 10); 
      const admin = new User({
        username: "admin",
        email: "admin@gmail.com",
        password: hashedPassword, 
        isAdmin: true,
        isAccountVerified: true,
      });
      await admin.save();

      console.log("Admin user created successfully");
    }
  } catch (error) {
    console.error("Error initializing admin:", error);
  }
}

module.exports = initAdmin;
