/* eslint-disable */
//  NPM packages
const express = require("express");
const crypto = require("crypto");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const asyncHandler = require("express-async-handler");

// imports
const {
	BadCredentialsError,
	BadParamsError,
	DuplicateKeyError,
} = require("../../lib/custom_errors");
const User = require("../models/user");
const chalk = require("chalk");
// const loginLimitter = require("../middlewares/loginLimiter");

// setups
const bcryptSaltRounds = 10;
const requireToken = passport.authenticate("bearer", { session: false });
const router = express.Router();
/* ASYNC AWAIT */

// POST
// SIGN UP
router.post(
	"/signup",
	asyncHandler(async (req, res, next) => {
		const { email, password, passwordConfirmation } = req.body.credentials;

		// check inputs
		if (!email || !password || password !== passwordConfirmation)
			throw new BadParamsError();

		// hash password - returns promise
		const hashed = await bcrypt.hash(password.toString(), bcryptSaltRounds);

		// create
		const user = await User.create({
			email,
			hashedPassword: hashed,
		});

		// response
		res.status(201).json({ user: user.toObject() });
	})
);

// POST
// SIGN IN
router.post(
	"/signin",
	asyncHandler(async (req, res, next) => {
		const { password, email } = req.body.credentials;

		// gets user from db
		const user = await User.findOne({ email });

		if (!user) throw new BadCredentialsError();

		// check that the password is correct
		let correctPassword = await bcrypt.compare(
			password,
			user.hashedPassword
		);

		if (!correctPassword) throw new BadCredentialsError();

		//# generate access token
		const accessToken = jwt.sign(
			{
				UserInfo: {
					id: user._id,
					email: user.email,
				},
			},
			process.env.ACCESS_TOKEN_SECRET,
			{ expiresIn: "1s" }
		);

		//# generate refresh token
		const refreshToken = jwt.sign(
			{ email: user.email },
			process.env.REFRESH_TOKEN_SECRET,
			{ expiresIn: "1d" }
		);

		// Create secure cookie with refresh token
		res.cookie("jwt", refreshToken, {
			httpOnly: true, //accessible only by web server
			secure: true, //https
			sameSite: "None", //cross-site cookie
			maxAge: 7 * 24 * 60 * 60 * 1000, //cookie expiry: set to match rT
		});

		//# set users accessToken
		user.accessToken = accessToken;

		// save user
		await user.save();

		// response
		res.status(200).json({ user: user.toObject() });
	})
);

// PATCH
// CHANGE password
router.patch(
	"/change-password",
	requireToken,
	asyncHandler(async (req, res, next) => {
		const { passwords } = req.body;

		// gets user from db
		const user = await User.findById(req.user.id);

		// check that the old password is correct
		const correctPassword = await bcrypt.compare(
			passwords.old,
			user.hashedPassword
		);

		if (!passwords.new || !correctPassword) throw new BadParamsError();

		// hash new password
		const newPass = await bcrypt.hash(passwords.new, bcryptSaltRounds);

		// set it to user
		user.hashedPassword = newPass;

		// save user
		await user.save();

		// response
		res.sendStatus(204);
	})
);

// DELETE
// SIGN OUT
// requireToken,
router.delete(
	"/signout",
	asyncHandler(async (req, res, next) => {
		console.log("user routes signout reached");
		const cookies = req.cookies;
		const { _id } = req.body;

		if (!cookies || !cookies.jwt) return res.sendStatus(204); //No content

		// clear cookies
		res.clearCookie("jwt", {
			httpOnly: true,
			sameSite: "None",
			secure: true,
		});
		console.log(chalk.green("cookies cleared"));

		// clear access token in user
		let user = await User.findOne({ _id});

		// create an custom Error like UserNotFound error
		if (!user) throw new BadCredentialsError();
		
		user.accessToken = null;
		console.log(chalk.green("accessToken cleared"));

		// save the token and respond with 204
		await user.save();

		// response
		res.sendStatus(204); //No content
	})
);

module.exports = router;
