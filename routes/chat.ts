import express, { NextFunction, Request, Response } from 'express';
import passport from 'passport';
import { allowRoles } from '../middlewares/verifyRoles';
import { Chat } from '../entities/chat.entity';
import { AppDataSource } from '../data-source';
import { IsNull, Not } from 'typeorm';
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
    if (req.user?.roleCode === 'R1') {
      return res.json(await chatRespository.find({ where: { employeeId: Not(IsNull()) }, order: { lastUpdated: 'DESC' } }));
    }
    res.json(await chatRespository.find({ where: { employeeId: parseInt(req.user?.id) }, order: { lastUpdated: 'DESC' } }));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Database Error' });
  }
});

//Client get messages by chat id
ChatRouter.get('/content/client/:id', async (req: Request, res: Response, next: NextFunction) => {
  const { phoneNumber, name } = req.query;
  try {
    if (!phoneNumber || !name) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }
    const chat = await chatRespository.findOne({
      where: { phoneNumber: phoneNumber.toString(), customerName: decodeURI(name.toString()), id: Number(req.params.id) },
    });
    if (!chat) {
      res.status(404).json({ message: 'Chat not found' });
      return;
    }
    const messages = await Message.find({ chatId: req.params.id }, { chatId: 0 });
    if (messages) {
      res.json(messages);
    } else {
      res.status(404).json({ message: 'Chat not found' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Database Error' });
  }
});

//Employee get messages by chat id
ChatRouter.get(
  '/content/:id',
  passport.authenticate('admin', { session: false }),
  allowRoles('R1', 'R3'),
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
