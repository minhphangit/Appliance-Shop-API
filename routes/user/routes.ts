import express from 'express';
const router = express.Router();
import authRouter from './auth';
import cartRouter from './cart';

router.use('/auth', authRouter);
router.use('/cart', cartRouter);

export default router;
