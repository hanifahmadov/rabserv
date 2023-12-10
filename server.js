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
// mongoose
// 	.connect(db, {
// 		useNewUrlParser: true,
// 		useCreateIndex: true,
// 		useUnifiedTopology: true,
// 	})
// 	.then(console.log(":: MongoDB connection successfull"));

// app & server created
const app = express();
const server = http.createServer(app);

let res = []

const io = new Server(server, {
	cors: corsOptions,
})

io.on("connection", (socket) => {

	console.log('newjoin', socket.id)

	socket.on('send_message', msg => {
		res.push(msg)
		io.emit('new_message', res)
	})
	// socket.on("join_server", (username) => {
	// 	const user = {
	// 		username,
	// 		id: socket.id,
	// 	};

	// 	users.push(user);
	// 	io.emit("new_users", users);
	// });

	// socket.on("join_room", (roomName, cb) => {
	// 	socket.join(roomName);
	// 	cb(messages[roomName]);
	// });

	// socket.on(
	// 	"send_message",
	// 	({ owner, content, to, roomName, isChannel }) => {
	// 		if (isChannel) {
	// 			const payload = {
	// 				content,
	// 				roomName,
	// 				owner,
	// 			};

	// 			socket.to(to).emit("new_message", payload);
	// 		} else {
	// 			const payload = {
	// 				content,
	// 				roomName: owner,
	// 				owner,
	// 			};

	// 			socket.to(to).emit("new_message", payload);
	// 		}

	// 		if(messages[roomName]) {
	// 			messages[roomName].push({
	// 				owner,
	// 				content
	// 			})
	// 		}


	// 	}
	// );

	// socket.on('disconnect', () => {
 
	// 	const users = users.filter(u => u.id !== socket.id) 
	// 	io.emit("new_users", users);
	// })
});

// // cors
// // app.use(cors({ origin: process.env.CLIENT_ORIGIN }))
// app.use(cors(corsOptions));

// // register passport authentication middleware
// app.use(auth);
// app.use(express.json());

// // cookie parser
// app.use(cookies());

// // this parses requests sent by `$.ajax`, which use a different content type
// app.use(express.urlencoded({ extended: true }));

// // log each request as it comes in for debugging
// app.use(requestLogger);

// // route files
// app.use(authRoutes);
// app.use(userRoutes);
// app.use(messageRoutes);
// app.use(exampleRoutes);

// // error Handler
// app.use(errorHandler);

app.get("/", (req, res) => {
	res.json({ message: "welcome to gg-chat-api" });
});

server.listen(PORT, () => {
	console.log(":: Server running on port", PORT);
});

// // needed just for testing
module.exports = server
