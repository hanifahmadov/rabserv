/* eslint-disable */
const Emitter = require("events");
const UserSocket = require("./UserSocket");
const Message = require("../app/models/message");
const Room = require("../app/models/room");
const { BadCredentialsError } = require("../lib/custom_errors");
const passport = require("passport");
const bearer = require("passport-http-bearer");
const jwt = require("jsonwebtoken");
const User = require("../app/models/user");

//: rename later
class IO {
	constructor(server) {
		this.events = new Emitter();
		this.server = server;
		this.rooms = [];
		this.users = [];
		this.justJoined = undefined;

		this.server.use(async (socket, next) => {
			const { _id } = socket.handshake.query;

			if (!_id) {
				next(new BadCredentialsError());
				return;
			} else {
				// retrive user from datebase
				const signedinUser = await User.findOne({ _id });

				// if no user handle error
				if (!signedinUser) next(new BadCredentialsError());
				// else case create a user socket for that specific userid
				else {
					// crating a new user socket and sending server,
					const newUser = new UserSocket(socket, this, signedinUser);

					this.justJoined = newUser;

					next();
				}
			}
		});

		this.server.on("connection", () => {

			console.log("just joined ::", this.justJoined.user.email);

			this.server.emit('message', "just joined :: " + this.justJoined.user.email)
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
