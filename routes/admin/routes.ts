import express from 'express';
const router = express.Router();

import authRouter from './auth';
import rolesRouter from './roles';

router.use('/auth', authRouter);
router.use('/roles', rolesRouter);

export default router;
