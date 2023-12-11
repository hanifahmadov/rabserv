/* eslint-disable */
// require authentication related packages
const passport = require("passport");
const bearer = require("passport-http-bearer");
const jwt = require("jsonwebtoken");
const User = require("../app/models/user");

const Room = require("../app/models/room");
const UserSocket = require("./UserSocket");
const { BadCredentialsError } = require("../lib/custom_errors");

const connected = [];
const rooms = [];
// {roomId: asdasd, users: []}

const newConnection = (socket) => {
	console.log("socket connected: ");
	connected.push(socket); // TODO: going to be a DB object
};

const validateToken = async (token, next) => {
	try {
		const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

		const user = await User.findOne({ _id: decoded.UserInfo.id });

		if (decoded && user) {
			console.log("user authenticated");
			return { pass: true, user}
		} else {
            console.log("user authenticated ERROR");
			throw new BadCredentialsError();
		}
	} catch (err) {
		console.error(err);
		// this.socket.emit("loggin", false);
		// this.destroy();
	}
};

const destroySocket = (socketId) => {
	const index = connected.findIndex((socket) => socket.id === socketId);
	if (index !== -1) {
		connected.splice(index, 1);
	}
};

const addListeners = (server) => {
	console.log("calling addlisteners");
	server.events.on("new-connection", newConnection);
};

const joinRoom = (roomId, socket) => {
	const existingRoom = rooms.find((room) => room.id === roomId);
	if (existingRoom) {
		existingRoom.users.push(socket);
		return;
	}
	rooms.push({ roomId, users: [socket] });
};

const deleteRoom = (roomId, server, userId, cb) => {
	// console.log(server.server.sockets)
	console.log("ATTEMPTING TO DELETE ROOMID=");
	console.log(userId);
	const connected = server.server.sockets.adapter.rooms.get(roomId);
	console.log("BEFORE LEAVING");
	console.log(connected);
	Room.deleteOne({ _id: roomId, owner: userId }).then((obj) => {
		console.log("received object");
		console.log(obj);
		if (obj.deletedCount > 0) {
			const room = rooms.find((room) => room.roomId === roomId);
			if (room) {
				room.users.forEach((userSocket) => {
					userSocket.socket.leave(roomId);
				});
				console.log("AFTER LEAVING");
				console.log(server.server.sockets.adapter.rooms.get(roomId));
				console.log("returning true");
				return cb(true);
			}
			// const connected = server.server.sockets.adapter.rooms.get(roomId)
			// console.log('BEFORE LEAVING')
			// console.log(connected)
			// connected.forEach(client => {
			//   console.log(client)
			//   client.leave(roomId)

			// })
			// server.server.clients(roomId).forEach(socket => socket.leave(roomId))
		}
		return cb(false);
	});
};

const checkRoomAccess = (userID, roomId) => {
	Room.findOne({ _id: roomId }, (err, room) => {
		if (err) return false;
		if (room.validUsers.includes(userID)) {
			return true;
		} else {
			return false;
		}
	});
};

module.exports = {
	addListeners,
	joinRoom,
	destroySocket,
	checkRoomAccess,
	deleteRoom,
	validateToken,
};
