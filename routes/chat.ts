import express, { NextFunction, Request, Response } from 'express';
import passport from 'passport';
import { allowRoles } from '../middlewares/verifyRoles';
import { Chat } from '../entities/chat.entity';
import { AppDataSource } from '../data-source';
import { IsNull } from 'typeorm';
import { Message } from '../entities/message.model';
const { passportVerifyToken } = require('../middlewares/passport');
passport.use('admin', passportVerifyToken);

const chatRespository = AppDataSource.getRepository(Chat);
export const ChatRouter = express.Router();

// Admin get all chat
ChatRouter.get('/all', passport.authenticate('admin', { session: false }), allowRoles('R1'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await chatRespository.find());
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Database Error' });
  }
});

//Employee get unassigned chat
ChatRouter.get(
  '/unassigned',
  passport.authenticate('admin', { session: false }),
  allowRoles('R1', 'R3'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await chatRespository.find({ where: { employeeId: IsNull() } }));
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Database Error' });
    }
  },
);

//Employee get assigned chat
ChatRouter.get('/assigned', passport.authenticate('admin', { session: false }), allowRoles('R1', 'R3'), async (req: any, res: Response, next: NextFunction) => {
  try {
    res.json(await chatRespository.find({ where: { employeeId: parseInt(req.user?.id) } }));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Database Error' });
  }
});

//Employee get messages by chat id
ChatRouter.get(
  '/content/:id',
  //   passport.authenticate('admin', { session: false }),
  //   allowRoles('R1', 'R3'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const chat = await Message.find({ chatId: req.params.id }, { chatId: 0 });
      if (chat) {
        res.json(chat);
      } else {
        res.status(404).json({ message: 'Chat not found' });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Database Error' });
    }
  },
);

//Employee get message by id
ChatRouter.get(
  '/message/:id',
  passport.authenticate('admin', { session: false }),
  allowRoles('R1', 'R3'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const message = await Message.findOne({ _id: req.params.id });
      if (message) {
        res.json(message);
      } else {
        res.status(404).json({ message: 'Message not found' });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Database Error' });
    }
  },
);
