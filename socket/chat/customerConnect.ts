import { Server } from 'socket.io';
import { AppDataSource } from '../../data-source';
import { Chat } from '../../entities/chat.entity';
import { socketData } from './chatHandler';

const chatRespository = AppDataSource.getRepository(Chat);

export const customerConnect = async (socket: any, io: Server, data: socketData) => {
  try {
    let chat = await chatRespository.findOne({
      where: { id: data.message.id, phoneNumber: data.message.phoneNumber, customerName: data.message.customerName },
    });
    if (!chat || chat.isFinished === true) {
      socket.emit('disconnected', data.message);
      console.log('User tried to join an unavailable chat');
    } else {
      socket.join(data.message.id.toString());
      console.log('customer joined room ' + data.message.id.toString());
    }
  } catch (error) {
    socket.emit('server-message', { type: 'error', message: 'Database Error' });
    console.error(error);
  }
};
