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
		this.socket.on("send_message", async (req) => {

			jwt.verify(
				this.socket.user.accessToken,
				process.env.ACCESS_TOKEN_SECRET,
				async (err, decoded) => {
					if (err) {
						console.log("error", err);
						this.socket.emit("custom_error", err);
					} else {
						await Message.create({
							owner: this.socket.user._id,
							room: req.roomId,
							text: req.msg,
						})
							.then(async (message) => {
								await Room.findById(req.roomId)
									.then(async (room) => {
										console.log(
											chalk.bold.red("room retrieved"),
											room
										);
										await room.messages.push(message._id);
										await room.save();

										// const populatedRoom =
										// 	await Room.populate(room, {
										// 		path: "users owner messages",
										// 		select: "-accessToken -hashedPassword",

										// 		populate: {
										// 			path: "owner", // Nested population for the 'owner' field
										// 			select: "-accessToken -hashedPassword", // Exclude fields for 'owner'
										// 		},
										// 	});

										const populatedMessage =
											await Message.populate(message, {
												path: "owner",
												select: "-accessToken -hashedPassword",
											});

										console.log(
											chalk.bold.red(
												"populated message and response"
											),
											populatedMessage
										);
										this.server.server.emit(
											"new_message",
											populatedMessage
										);
									})
									.catch((err) => {
										console.log("room cant find");
									});
							})
							.catch((err) => {
								console.log("message cretation error");
								console.log(err);
							});
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

			console.log('payloadd', )
			const room = await Room.findById(payload.roomId);

			await room.users.push(payload.userId);
			await room.save();

			const updatetRoom = await Room.populate(room, {
				path: "owner users messages",
				select: "-accessToken -hashedPassword",
			});

			

			this.socket.emit("joinroom", { room: updatetRoom });
		});
	}
}

module.exports = UserSocket;
