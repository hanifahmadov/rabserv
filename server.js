/* eslint-disable */

// NPM packages
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookies = require("cookie-parser");
const { Server } = require("socket.io");
const http = require("http");
const path = require("path");
const IO = require("./src/IO");

// create .env file for private db || apis
require("dotenv").config();

// imports
const db = require("./config/db");
const auth = require("./lib/auth");
const errorHandler = require("./lib/error_handler");
const requestLogger = require("./lib/request_logger");

// routes
const userRoutes = require("./app/routes/user_routes");
const authRoutes = require("./app/routes/auth_routes");
const exampleRoutes = require("./app/routes/example_routes");
const messageRoutes = require("./app/routes/message_routes");
const corsOptions = require("./config/corsOptions");

// Passport docs: http://www.passportjs.org/docs/
const passport = require("passport");
const requireAccessToken = passport.authenticate("bearer", { session: false });

// ports
const PORT = process.env.PORT || 3040;
// const clientDevPort = 7165

// database connection
mongoose
	.connect(db, {
		useNewUrlParser: true,
		useCreateIndex: true,
		useUnifiedTopology: true,
	})
	.then(console.log(":: MongoDB connection successfull"));

// app & server created
const app = express();

const server = http.createServer(app);

const io = new Server(server, {
	cors: corsOptions,
}); // .listen(server);


const IOServer = IO.create(io);

// app.set('ioserver', IOServer)


// io.on("connection", (socket) => {

//   console.log("just joined ::", socket.id);
//   socket.emit('message', socket.id + " has connected")

//   socket.on('disconnect', (socket) => {
//     console.log("just joined ::", socket.id);
//     io.emit('disconnected', socket.id + " has disconnected")
//   })

//   socket.on('message', msg => {
//     io.emit('response', 'this is response from server + ' + msg)
//   })

// });

// cors
// app.use(cors({ origin: process.env.CLIENT_ORIGIN }))
app.use(cors(corsOptions));

// register passport authentication middleware
app.use(auth);
app.use(express.json());

// cookie parser
app.use(cookies());

// this parses requests sent by `$.ajax`, which use a different content type
app.use(express.urlencoded({ extended: true }));

// log each request as it comes in for debugging
app.use(requestLogger);

// route files
app.use(authRoutes);
app.use(userRoutes);
app.use(messageRoutes);
app.use(exampleRoutes);

// error Handler
app.use(errorHandler);

server.listen(PORT, () => {
	console.log(":: Server running on port", PORT);
});

// needed just for testing
module.exports = IOServer