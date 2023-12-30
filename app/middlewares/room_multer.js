/* eslint-disable */
var fs = require('fs');
const path = require("path");
const multer = require("multer");
const {
	BadCredentialsError,
	BadParamsError,
	DocumentNotFoundError,
} = require("../../lib/custom_errors");
const { v4: uuidv4 } = require('uuid');
// Storage


const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		
		const rootDir = path.dirname(require.main.filename);
		const dir = rootDir + "/public/room_avatars/";

		// fs.rmSync(dir, { recursive: true, force: true });
		fs.mkdirSync(dir, { recursive: true }, err => {
			cb(err, false);
		});
		
		cb(null, dir);
	},

	filename: (req, file, cb) => {
		const ext = file.mimetype.split("/")[1];
		req.filename = req.user.email.split('@')[0] + "_" + uuidv4() + '.' + ext;
		cb(null, req.filename);
	},
});

const fileFilter = (req, file, cb) => {
	let allowTypes = [
		"image/jpg",
		"image/jpeg",
		"image/png",
		"image/gif",
		"image.jpg",
		"image.jpeg",
		"image.png",
		"image.gif",
	];

	if(!allowTypes.includes(file.mimetype)) {
		return cb(new BadCredentialsError(), false)
	}

	return cb(null, true)
};


const room_multer = multer({ storage, fileFilter})
module.exports = room_multer 