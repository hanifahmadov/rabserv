/* eslint-disable */

// NPM packages
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const cookies = require("cookie-parser") 
const { Server } = require('socket.io');
const http = require('http')
const path = require('path')



// create .env file for private db || apis
require('dotenv').config()

// imports
const db = require('./config/db')
const auth = require('./lib/auth')
const errorHandler = require('./lib/error_handler')
const requestLogger = require('./lib/request_logger')



// routes
const userRoutes = require('./app/routes/user_routes')
const authRoutes = require('./app/routes/auth_routes')
const exampleRoutes = require('./app/routes/example_routes')
const corsOptions = require('./config/corsOptions')


// ports
const PORT = process.env.PORT || 3040
// const clientDevPort = 7165

// database connection
mongoose.connect(db, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true
}).then(console.log(':: MongoDB connection successfull'))

// app & server created
const app = express()

const server = http.createServer(app);

const io = new Server(server, {
  cors: corsOptions
});

io.on('connect', (socket) => {
  console.log('a user connected');

   socket.on('message', message => {
    console.log(message)

    socket.broadcast.emit('message', message)
   })

   
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/src/index.html'));
});

// cors
// app.use(cors({ origin: process.env.CLIENT_ORIGIN }))
app.use(cors(corsOptions))


// register passport authentication middleware
app.use(auth)
app.use(express.json())

// cookie parser
app.use(cookies())

// this parses requests sent by `$.ajax`, which use a different content type
app.use(express.urlencoded({ extended: true }))

// log each request as it comes in for debugging
app.use(requestLogger)

// route files
app.use(authRoutes)
app.use(userRoutes)
app.use(exampleRoutes)



// error Handler
app.use(errorHandler)

server.listen(PORT, () => {
  console.log(':: Server running on port', PORT)
})



// needed just for testing
module.exports = server

