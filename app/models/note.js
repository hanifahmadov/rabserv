/* eslint-disable */
const mongoose = require("mongoose");
const AutoIncrement = require('mongoose-sequence')(mongoose)

const noteSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			ref: 'User',
		},

		title: {
			type: String,
			required: true,
		},

		text: {
			type: String,
			unique: true,

		},

		completed: {
			type: Boolean,
			default: false,
		},
	},

	{
		timestamps: true,
	}
);

noteSchema.plugin(AutoIncrement, {
    inc_field: 'ticket',
    id: 'ticketName',
    start_seq: 500,
    
})

module.exports = mongoose.model("User", userSchema);
