import { Server } from 'socket.io';
import { AppDataSource } from '../../data-source';
import { Chat } from '../../entities/chat.entity';
import { socketData } from './chatHandler';

const chatRespository = AppDataSource.getRepository(Chat);

export const chatClose = async (socket: any, io: Server, data: socketData) => {
  try {
    let chat = await chatRespository.findOneBy({ id: data.message });
    if (chat) {
      chat.isFinished = true;
      await chatRespository.save(chat);
      io.to(chat.id.toString()).emit('disconnected', chat.id);
      console.log(`Chat ${chat.id} closed`);
    } else {
      socket.emit('server-message', { type: 'error', message: 'Chat not found' });
    }
  } catch (error) {
    socket.emit('server-message', { type: 'error', message: 'Database Error' });
    console.error(error);
  }
};
