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
		this.socket.on(
			"send_message",
			asyncHandler(async (req) => {
				jwt.verify(
					this.socket.user.accessToken,
					process.env.ACCESS_TOKEN_SECRET,
					async (err, decoded) => {
						if (err) {
							console.log(
								"35: UserSockets.js ~ token error: ",
								err
							);
							this.socket.emit("custom_error", err);
						} else {
							const message = await Message.create({
								owner: this.socket.user._id,
								room: req.roomId,
								text: req.text,
							});

							const room = await Room.findById(req.roomId);
							await room.messages.push(message._id);
							await room.save();

							const allRooms = await Room.find().populate({
								path: "users owner messages",
								select: "-accessToken -hashedPassword",
								populate: {
									path: "owner",
									select: "-accessToken -hashedPassword",
								},
							});

							const curRoom = await allRooms.find(
								(room) => room._id == req.roomId
							);

							console.log('curRoom', curRoom)

							this.server.server.emit("newMessageUpdates", {
								allRooms,
								curRoom,
							});
						}
					}
				);
			})
		);

		this.socket.on(
			"create_room",
			asyncHandler(async (msg) => {
				console.log("UserSockets ~ on.create_room ~ msg:", msg);

				await Room.create({
					name: msg.roomName,
					owner: msg.roomOwner,
					users: msg.roomOwner,
					icon: msg.roomIconTitle,
				})
					.then(async (room) => {
						// join the room that u just created
						this.socket.join(room.name);
						this.joinedrooms.push(room.name);

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
			})
		);

		this.socket.on("joinroom", async (payload) => {
			console.log("payloadd", payload);
			const room = await Room.findById(payload.roomId);

			await room.users.push(payload.userId);
			await room.save();

			const allrooms = await Room.find().populate("owner users messages");

			this.socket.emit("joinroom", { rooms: allrooms });
		});
	}
}

module.exports = UserSocket;
