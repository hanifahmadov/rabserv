/* eslint-disable */
const Emitter = require("events");
const UserSocket = require("./UserSocket");
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

//: rename later
class IO {
	constructor(server) {
		this.events = new Emitter();
		this.server = server;
		this.rooms = ["general", "jokes"];
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

						let user = await User.findOne({
							_id: UserInfo.id,
						});

						// if user not found or error
						if (!user) next(new BadCredentialsError());

						// else attach user to socket
						socket.user = new UserSocket(this, socket, user);

						this.users.push(socket);

						// continue
						next();
					} catch (err) {
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
			.on("connection", (socket) => {
				console.log("new connection : " + socket.user.info.email);

				this.server.emit(
					"new_connection",
					"just joined :: " + socket.user.info.email
				);

				socket.on("disconnect", () => {
					console.log(
						"new disconnection : " + socket.user.info.email
					);
					this.server.emit(
						"new_disconnection",
						"just disconnected :: " + socket.user.info.email
					);
				});

				socket.on("send_message", async (msg) => {
					// verify token first then reply

					console.log(msg);

					try {
						const { UserInfo } = jwt.verify(
							socket.user.info.accessToken,
							process.env.ACCESS_TOKEN_SECRET
						);

						if (UserInfo.id) {
							let temp =
								msg + " from :: " + socket.user.info.email;

							console.log(temp);
							this.messages.push(temp);
							this.server.emit("new_message", this.messages);
						}
					} catch (err) {
						console.log("token expired");
						console.log(err);
					}
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

	findRoomById(roomId) {
		return this.rooms.find((room) => room.id === roomId);
	}

	createNewRoom(roomName, roomId) {
		const room = { id: roomId, name: roomName};
		this.rooms.push(room);
		return room;
	}

}

module.exports = IO;
