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
const fileRoutes = require("./app/routes/file_routes");
const corsOptions = require("./config/corsOptions");

// Passport docs: http://www.passportjs.org/docs/
const passport = require("passport");
const requireAccessToken = passport.authenticate("bearer", { session: false });

// ports
const PORT = process.env.PORT || 3040;

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

const socketio = new Server(server, {
	cors: corsOptions,
});



// cors
app.use(cors(corsOptions));

// register passport authentication middleware
app.use(auth);
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public/defaults')));
app.use(express.static(path.join(__dirname, 'public/room_avatars')));
app.use(express.static(path.join(__dirname, 'public/profile_avatars')));

// cookie parser
app.use(cookies());

// this parses requests sent by `$.ajax`, which use a different content type
app.use(express.urlencoded({ extended: true }));

// log each request as it comes in for debugging
app.use(requestLogger);

app.get("/", (req, res) => res.json({ message: "welcome to RabbitChat" }));

// refresh token routes
app.use(authRoutes);

// login funtionalities
app.use(userRoutes);
app.use(fileRoutes)


const IOserver = IO.create(socketio)

app.set('ioserver', IOserver)




// error Handler
app.use(errorHandler);

server.listen(PORT, () => {
	console.log(":: Server running on port", PORT);
});

// // needed just for testing
module.exports = server;




