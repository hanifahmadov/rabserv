/* eslint-disable */
const {
	joinRoom,
	destroySocket,
	deleteRoom,
	checkRoomAccess,
} = require("./SocketListeners");
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
		this.rooms = [];
		this.user = user;

		this.listerners();
	}

	listerners() {

        this.socket.on('message', message => {
            console.log(message)

            this.server.server.emit('message', 'this is response :: ' +  message)

        })

        this.socket.on('disconnect', message => {
            console.log(message)

            this.server.server.emit('message', 'user has been disconnected ' +  message)
        })

       


	}
}

module.exports = UserSocket;
