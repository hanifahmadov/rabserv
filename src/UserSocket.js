/* eslint-disable */

class UserSocket {
	constructor(server, socket, info ) {
		this.info = info
		this.joinedrooms = [];
		this.socket = socket
		this.server = server

		

		
		
		this.listerners();
	}

	listerners() {



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
