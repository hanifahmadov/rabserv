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
			index: {
				unique: true,
				collation: { locale: 'en', strength: 2 }
			}

		},

		owner: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},

		users: {
			type: [mongoose.Schema.Types.ObjectId],
			ref: "User",
			default: [],
		},

		messages: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Message",
			},
		],

		icon: {
			type: String,
			default: "default.png", // Provide a default URL or path if needed
		},
	},
	{
		timestamps: true,
	}
);

// Middleware to ensure unique user IDs in the users array
roomSchema.pre("save", function (next) {
	// const uniqueUsers = [...new Set(this.users.map(String))];
	// this.users = uniqueUsers;
	// next();
	this.users = [...new Set(this.users.map(id => id.toString()))];
	next()
});

// Add this virtual field to the schema
// roomSchema.virtual("populatedUsers", {
// 	ref: "User",
// 	localField: "users",
// 	foreignField: "_id",
// 	justOne: false,
// 	options: { select: "-accessToken" }, // Exclude 'accessToken' field
// });

// roomSchema.set("toObject", { virtuals: true });
// roomSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Room", roomSchema);
