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
const asyncHandler = require("express-async-handler");

//: rename later
class IO {
	constructor(server) {
		this.events = new Emitter();
		this.server = server;
		this.rooms = new Set();
		this.activeusers = [];
		this.messages = [];
		this.newUser = undefined;

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
					console.log(
						"41: IO.js ~ socket: token missing or not provided"
					);
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

						// continue
						next();
					} catch (err) {
						console.log("70: IO.js ~ err code", err.code);
						// if jwt is expired
						console.log("72: IO.js ~ socket: TOKEN EXPIREDDDDD");
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
			.on(
				"connection",
				asyncHandler(async (socket) => {
					console.log(
						"90: IO.js ~ new connection ~ username: " +
							socket.user.email
					);

					/* SETUP BASICS */
					const checkActiveUsers = this.activeusers.some((v) =>
						v.equals(socket.user._id)
					);
					if (!checkActiveUsers) {
						this.activeusers.push(socket.user._id);
					}

					// Default room RABBIT
					// Get all Users
					let room = await Room.findOne({ name: "rabbit" });
					let users = await User.find().select(
						"-accessToken -hashedPassword"
					);

					// IF RABBIT
					if (!room) {
						room = await Room.create({
							name: "rabbit",
							owner: mongoose.Types.ObjectId(),
						});

						console.log("116: IO.js ~ Rabbit room created!");
					}

					await room.users.push(socket.user._id);
					await room.save();

					socket.join(room.name.trim());

					// GET ALL ROOMS
					await Room.find().then(async (rooms) => {
						await rooms.map((room) => {
							if (room.users.includes(socket.user._id)) {
								socket.join(room.name.trim());
							}
						});

						const newUser = new UserSocket(this, socket);

						const populatedRooms = await Room.populate(rooms, {
							path: "users owner messages",
							select: "-accessToken -hashedPassword",

							populate: {
								path: "owner", // Nested population for the 'owner' field
								select: "-accessToken -hashedPassword", // Exclude fields for 'owner'
							},
						});

						/**
						 * 	why in re-spread the popilatedRooms and users
						 * 	cause, it may possible to have just a sigle room or single user
						 * 	then in the client side, it may not be get accepted single object but
						 * 	client side will get the single object in an array [ {} ]
						 * 	and in this case the client-side response can be iterrable
						 *
						 */
						this.server.emit("new_connection", {
							newUser: socket.user,
							rooms: [...populatedRooms],
						});

						this.server.emit("users_onConnection", {
							activeUsers: [...new Set(this.activeusers)],
							allUsers: users,
						});
					});

					// ON DISCONNECT
					socket.on(
						"disconnect",
						asyncHandler(async () => {
							console.log(
								"170: IO.js ~ socket: disconnected user: " +
									socket.user.email
							);

							/** why retrieving all users on disconnection ?
							 * 	cause of previous users states cant get retrieved
							 * 	when client side socket.on disconnection
							 * */
							let users = await User.find().select(
								"-accessToken -hashedPassword"
							);

							let index = this.activeusers.indexOf(
								socket.user._id
							);

							this.activeusers.splice(index, 1);

							this.server.emit("users_onDisconnection", {
								activeUsers: this.activeusers,
								allUsers: users,
							});
						})
					);
				})
			);
	}

	static create(server) {
		const newServer = new this(server);
		// create one room for all users to use
		return newServer;
	}
}

module.exports = IO;
