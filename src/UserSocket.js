/* eslint-disable */
const {
	joinRoom,
	destroySocket,
	deleteRoom,
	checkRoomAccess,
} = require("./Listeners");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = process.env;
const User = require("../app/models/user");
const Emitter = require("events");
const { v4 } = require("uuid");

class UserSocket {
	constructor(socket, server, user) {
		this.events = new Emitter();
		this.socket = socket;
		this.server = server;
		this.joinedrooms = [];
		this.user = user;

		this.listerners();
	}

	listerners() {

        // this.server.server.on('disconnection', message => {
		// 	console.log("new_disconnection : " + this.user.email);
        // })

		// this.server.server.emit('new_disconnection', this.user.email + ' disconnected')
	}
}

module.exports = UserSocket;
