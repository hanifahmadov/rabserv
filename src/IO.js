/* eslint-disable */
const Emitter = require("events");
const UserSocket = require("./UserSocket");
const Message = require("../app/models/message");
const Room = require("../app/models/room");
const mongoose = require("mongoose");
const {
	SocketMissingTokenError,
	SocketExpireTokendError,
	BadCredentialsError,
} = require("../lib/custom_errors");
const passport = require("passport");
const bearer = require("passport-http-bearer");
const jwt = require("jsonwebtoken");
const User = require("../app/models/user");

//: rename later
class IO {
	constructor(server) {
		this.events = new Emitter();
		this.server = server;
		this.rooms = new Set();
		this.users = [];
		this.messages = [];
		this.newJoinedUser = undefined;

		this.server
			.use(async (socket, next) => {
				// console.log(socket.handshake.headers)
				const headers = socket.handshake.headers;

				const authorization =
					headers.authorization && headers.authorization;

				// console.log("authorization ", authorization);

				if (
					authorization == undefined ||
					authorization == "undefined"
				) {
					console.log("token missing or not provided");
					next(new SocketMissingTokenError(authorization));
				} else {
					const token = authorization.split(" ")[1];

					// verify token
					try {
						// if jwt is valid
						const { UserInfo } = jwt.verify(
							token,
							process.env.ACCESS_TOKEN_SECRET
						);

						// get signedin user fromdb
						let user = await User.findOne({
							_id: UserInfo.id,
						});

						// if user not found or error
						if (!user) next(new BadCredentialsError());

						// else attach user to socket
						socket.user = user;

						this.users.push(socket);

						// continue
						next();
					} catch (err) {
						console.log("err code", err.code);
						// if jwt is expired
						console.log(" TOKEN EXPIREDDDDD");
						next(new SocketExpireTokendError());
					}
				}
			})

			// DONE
			// the problecm is, when user signed out, it didnt get disconnect so
			// we have to take server into signout route(app.get) and then for to disconnect

			/**
			 * 	signout disconnection happens only in client side
			 * 	if (signout.api-axios) is successfull
			 * 	just call socket.disconnect()
			 */

			// handling the connections and disconnections right on the server
			.on("connection", async (socket) => {
				console.log("new connection : " + socket.user.email);

				// setup basics

				try {
					// created a user object
					const newUser = new UserSocket(this, socket);

					// created a default general room for all
					// need an room id for creating a messages
					let room = await Room.findOne({ name: "general" });

					// console.log(room)

					// if roomName is
					if (!room) {
						console.log("room general created!");
						room = await Room.create({
							name: "general",
							owner: mongoose.Types.ObjectId()
						});
					}

					await room.users.push(socket.user._id);
					await room.save();


					socket.join(room._id.toString())

					console.log("new users aded to room general and saved");

					
					const allRooms = await Room.find().populate({
						path: "users",
						select: "-accessToken -hashedPassword",
					}).populate({
						path: "owner",
						select: "-accessToken -hashedPassword",
					})

					this.server.emit("just_connected", {
						justConnected: socket.user.email,
						room: [...allRooms],
					});
				} catch (err) {
					console.log("err code ", err);
				}

				// ON DISCONNECT
				socket.on("disconnect", () => {
					console.log("new disconnection : " + socket.user.email);
					this.server.emit("just_disconnected", {
						username: socket.user.email,
					});
				});
			});

		// SERVER ON NEW ROOM
		// this.server.on("create_room", (result) => {
		// 	console.log(
		// 		"🚀 ~ file: IO.js:140 ~ IO ~ constructor ~ result:",
		// 		result
		// 	);
		// });
	}

	static create(server) {
		const newServer = new this(server);
		// create one room for all users to use
		return newServer;
	}

	// sendResponse(res, user) {
	// 	console.log("server sending message: ", res);
	// 	this.server
	// 		.to(res.roomId)
	// 		.emit(`response`, `from user ${user}:: ` + res);
	// }

	// findRoomById(roomId) {
	// 	return this.rooms.find((room) => room.id === roomId);
	// }

	// createNewRoom(roomName, roomId) {
	// 	const room = { id: roomId, name: roomName };
	// 	this.rooms.push(room);
	// 	return room;
	// }
}

module.exports = IO;
