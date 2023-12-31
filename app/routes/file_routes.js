/* eslint-disable */
const multer  = require('multer')
const room_multer = require('../middlewares/room_multer')
// Express docs: http://expressjs.com/en/api.html
const express = require('express')


// Passport docs: http://www.passportjs.org/docs/
const passport = require('passport')

// this is a collection of methods that help us detect situations when we need
// to throw a custom error
const customErrors = require('../../lib/custom_errors')

// we'll use this function to send 404 when non-existant document is requested
const handle404 = customErrors.handle404
// we'll use this function to send 401 when a user tries to modify a resource
// that's owned by someone else
const requireOwnership = customErrors.requireOwnership

// this is middleware that will remove blank fields from `req.body`, e.g.
// { example: { title: '', text: 'foo' } } -> { example: { text: 'foo' } }
const removeBlanks = require('../../lib/remove_blank_fields')
// passing this as a second argument to `router.<verb>` will make it
// so that a token MUST be passed for that route to be available
// it will also set `req.user`
const requireAccessToken = passport.authenticate('bearer', { session: false })

// instantiate a router (mini app that only handles routes)
const router = express.Router()



// router.use(requireAccessToken);

/**
 *  # DONT apply require in route level
 *  in this case, it affects all the routes below
 *  which comes after examples routes.
 *  use inline middleware level instead like below:
 *  # router.get('/examples', requireAccessToken, (req, res, next) => {}
 */ 


//: INDEX
//: GET /examples
router.post('/newroom_icon', requireAccessToken, room_multer.single('icon'), (req, res, next) => {
    res.status(200).json({ imgTitle: req.filename});
})



module.exports = router