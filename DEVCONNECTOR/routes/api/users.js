const express = require('express');
const router = express.Router();
const {check, validationResult} = require('express-validator');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const config = require('config');
// const normalize = require('normalize-url');
// @route POST api/users
// @desc Register user
// @access Public
router.post('/', [
    check('name', 'Name is required')
    .not()
    .isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check(
        'password',
        'Please enter a password with 6 or more characters'
    ).isLength({ min: 6})
], 
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // pull out from req.body

        const { name, email, password } = req.body;

        try {
            // See if user exists
            let user = await User.findOne( { email });
            if (user) {
                return res
                .status(400)
                .json({ errors: [{ msg: 'User already exists' }] });
            }
            // Get users gravatar
            const avatar = 
                gravatar.url(email, {
                s: '200', // default size string length
                r: 'pg', // read
                d: 'mm' //default image(user icon)
                });
          

            user = new User({
                name,
                email,
                avatar,
                password
            });
            // Encrypt password
            const salt = await bcrypt.genSalt(10);

            user.password = await bcrypt.hash(password, salt);

            await user.save();
            // Return jwt
            const payload = {
                user: {
                id: user.id
                }
            };
        
            jwt.sign(
            payload,
            config.get('jwtSecret'),
            { expiresIn: '5 days' },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
            );
            // res.send('User Registered');
        } catch(err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }

});

module.exports = router;