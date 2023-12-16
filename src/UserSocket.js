/* eslint-disable */
/* eslint-disable */
const Message = require("../app/models/message");
const Room = require("../app/models/room");
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
const chalk = require("chalk");

class UserSocket {
	constructor(server, socket) {
		this.joinedrooms = [];
		this.socket = socket;
		this.server = server;

		this.listerners();
	}

	listerners() {
		this.socket.on("send_message", async (msg) => {
			console.log(msg);

		
				jwt.verify(
					this.socket.user.accessToken,
					process.env.ACCESS_TOKEN_SECRET,
					(err, decoded) => {
						if (err) {
							console.log("error", err);
							this.socket.emit("custom_error", err);
						} else {
							console.log("msg sends to provided roomId");
							this.server.server.to(msg.roomId).emit(
								"new_message",
								msg
							);
						}
					}
				);
		
		});

		this.socket.on(
			"create_room",
			asyncHandler(async (msg) => {
				console.log("UserSockets ~ on.create_room ~ msg:", msg);

				await Room.create({
					name: msg.roomName,
					owner: msg.roomOwner,
					users: msg.roomOwner,
				})
					.then(async (room) => {
						let res = await Room.populate(room, {
							path: "users owner",
							select: "-accessToken -hashedPassword",
						});

						this.server.server.emit("new_room", {
							room: res,
						});
					})
					.catch((err) => {
						console.log(
							chalk.red(
								"72: UserSocket ~ create newroom catch error "
							)
						);
						// TODO
						// create a custom error that will return an already exist error
						// this is temporary
						this.socket.emit(
							"custom_error",
							new BadCredentialsError()
						);
					});

				// if(!newRoom) throw new BadCredentialsError()
				// else this.server.server.emit("new_room", { room: await newRoom.populate('owner') });
			})
		);
	}
}

module.exports = UserSocket;
