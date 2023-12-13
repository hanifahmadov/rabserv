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

			try {
				// get decoded out of token verification
				const { UserInfo } = jwt.verify(
					this.socket.user.accessToken,
					process.env.ACCESS_TOKEN_SECRET
				);

				// console.log("token is valid");

				// if token is valid
				if (UserInfo.id) {
					
					//create a Message

					// console.log(temp);
					this.server.messages.push(temp);
					this.server.server.emit(
						"new_message",
						this.server.messages
					);
				}

			} catch (err) {
				// if token expired
				console.log("token expired");
				console.log(err);
			}
		});

		// socket.on("send_message", async (msg) => {
		// 	// verify token first then reply

		// 	this.messages.push(msg);
		// 	this.server.emit("new_message", this.messages);

		// 	// try {
		// 	// 	const { UserInfo } = jwt.verify(socket.user.accessToken, process.env.ACCESS_TOKEN_SECRET);

		// 	// 	console.log(UserInfo)

		// 	// 	if(UserInfo && UserInfo.id && UserInfo.email){
		// 	// 		this.messages.push(msg);
		// 	// 		this.server.emit("new_message", this.messages);
		// 	// 	}
		// 	// } catch(err){
		// 	// 	console.log(err)
		// 	// 	// next(new SocketExpireTokendError());
		// 	// }
		// });
	}
}

module.exports = UserSocket;
