const express = require('express')
const connectToDb = require('./config/connectToDb');
const { errorHandler, notFound } = require('./middlewares/error');
require('dotenv').config()
const cors = require("cors");

//* Connection To DB
connectToDb();

// Init App
const app = express();

// Middlewares
app.use(express.json()) 
app.use(cors());

// routes
app.use("/api/auth", require("./routes/auth.routes"))
app.use("/api/users", require("./routes/users.routes"))
app.use("/api/posts", require("./routes/posts.routes"))
app.use("/api/comments", require("./routes/comments.routes"))
app.use("/api/categories", require("./routes/categories.routes"))

// Error Handler Middleware
app.use(notFound)
app.use(errorHandler)


// Running The server
const PORT = process.env.PORT || 8000
app.listen(PORT, () => {
  console.log(`server is running in ${process.env.NODE_ENV} mode on port ${PORT}`)
})

