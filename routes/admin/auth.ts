import express, { NextFunction, Request, Response } from 'express';
const router = express.Router();
import passport from 'passport';

import { forgotPassword, resetPassword, login, refreshToken, loginSuccess } from '../../controllers/employee';
require('dotenv').config();
const { passportVerifyAccount } = require('../../middlewares/passport');

passport.use('localAdmin', passportVerifyAccount);

//POST login with jwt token
router.post('/login', passport.authenticate('localAdmin', { session: false }), login);

//Refresh token
router.post('/refresh-token', refreshToken);

router.post('/login-success', loginSuccess);

// forgot password
router.get('/forgot-password', forgotPassword);
router.put('/reset-password', resetPassword);
export default router;
