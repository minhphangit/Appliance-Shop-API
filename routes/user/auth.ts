import express, { NextFunction, Request, Response } from 'express';
import { Profile } from 'passport-google-oauth20';
const router = express.Router();
import passport from 'passport';

import passportGG from '../../middlewares/passportGoogle';
import passportFB from '../../middlewares/passportFB';
import { forgotPassword, resetPassword, login, register, refreshToken, loginSuccess, verifyRecaptcha } from '../../controllers/customer';
require('dotenv').config();
const { passportVerifyAccount } = require('../../middlewares/passport');

passport.use('local', passportVerifyAccount);

//POST login with jwt token
router.post('/login', verifyRecaptcha, passport.authenticate('local', { session: false }), login);

//POST REGISTER WITH JWT token
router.post('/register', verifyRecaptcha, register);
//Refresh token
router.post('/refresh-token', refreshToken);

//login with google
router.get('/google', passportGG.authenticate('google', { scope: ['profile', 'email'], session: false }));

router.get('/google/callback', (req, res, next) => {
  passportGG.authenticate('google', (err: any, profile: Profile) => {
    if (err) {
      console.log('««««« err »»»»»', err);
      return res.status(500).send('Authentication failed');
    }
    req.user = profile;
    //@ts-ignore
    res.redirect(`${process.env.CLIENT_URL}/login-success/?email=` + req.user?.email);
  })(req, res, next);
});

//login with facebook
router.get('/facebook', passportFB.authenticate('facebook', { scope: ['email'] }));

router.get('/facebook/callback', (req, res, next) => {
  passportFB.authenticate('facebook', (err: any, profile: Profile) => {
    if (err) {
      return res.status(500).send('Authentication failed');
    }
    req.user = profile;
    //@ts-ignore
    res.redirect(`${process.env.CLIENT_URL}/login-success/?email=` + req.user?.email);
  })(req, res, next);
});

router.post('/login-success', loginSuccess);

// forgot password
router.post('/forgot-password', verifyRecaptcha, forgotPassword);
router.put('/reset-password', resetPassword);
export default router;
