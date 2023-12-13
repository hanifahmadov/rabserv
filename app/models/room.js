/* eslint-disable */
const mongoose = require("mongoose");
const Message = require("./message");
const Schema = mongoose.Schema;

const roomSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			unique: true,
			trim: true,
		},

		owner: {
			type: mongoose.Schema.Types.Mixed,
			ref: "User",
			required: true,
		},

		users: [
			{
				type: mongoose.Schema.ObjectId,
				ref: "User",
			},
		],

		messages: [
			{
				type: Schema.ObjectId,
				ref: "Message",
			},
		],
	},
	{
		timestamps: true,
	}
);



module.exports = mongoose.model("Room", roomSchema);
