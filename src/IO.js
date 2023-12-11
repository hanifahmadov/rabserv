/* eslint-disable */
const Emitter = require("events");
const UserSocket = require("./UserSocket");
const Message = require("../app/models/message");
const Room = require("../app/models/room");
const { SocketUserIDError } = require("../lib/custom_errors");
const passport = require("passport");
const bearer = require("passport-http-bearer");
const jwt = require("jsonwebtoken");
const User = require("../app/models/user");

//: rename later
class IO {
	constructor(server) {
		this.events = new Emitter();
		this.server = server;
		this.rooms = [{ name: "general", messages: [], owner: "default" }];
		this.users = [];
		this.newJoinedUser = undefined;

		this.server
			.use(async (socket, next) => {
				try {
					const { _id } = await socket.handshake.query;

					if (_id == "undefined" || _id == "null") {
						console.log("fukiii user id is not provided");
						next(new SocketUserIDError(_id));
					} else {
						const signedinUser = await User.findOne({ _id });
						// if no user handle error
						if (!signedinUser) next(new BadCredentialsError());
						// else case create a user socket for that specific userid
						else {
							// crating a new user socket and sending server,
							const newUser = new UserSocket(
								socket,
								this,
								signedinUser
							);

							socket.user = newUser.user;

							this.users.push(socket);
							this.newJoinedUser = socket;

							next();
						}
					}
				} catch (err) {
					console.log("error");
					console.log(err);
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
			.on("connection", (socket) => {
				console.log("new connection : " + socket.user.email);

				this.server.emit(
					"new_connection",
					"just joined :: " + socket.user.email
				);

				socket.on("disconnect", () => {
					console.log("new disconnection : " + socket.user.email);
					this.server.emit(
						"new_disconnection",
						"just disconnected :: " + socket.user.email
					);
				});
			});
	}

	static create(server) {
		const newServer = new this(server);
		// create one room for all users to use
		newServer.rooms.push(0);
		return newServer;
	}

	sendResponse(res, user) {
		console.log("server sending message: ", res);
		this.server
			.to(res.roomId)
			.emit(`response`, `from user ${user}:: ` + res);
	}

	findRoomByName(name) {
		return this.rooms.find((room) => room.name === name);
	}

	findRoomById(roomId) {
		return this.rooms.find((room) => room.id === roomId);
	}

	newRoom(roomName, roomId) {
		const room = { name: roomName, id: roomId };
		this.rooms.push(room);
		return room;
	}

	logEmitter() {
		console.log(this.events);
	}
}

module.exports = IO;
