import { Server, Socket } from 'socket.io';
import { AppDataSource } from '../../data-source';
import { Chat } from '../../entities/chat.entity';
import { socketData } from './chatHandler';

const chatRespository = AppDataSource.getRepository(Chat);

export const chatStart = async (socket: Socket, io: Server, data: socketData) => {
  let newChat = new Chat();
  newChat.customerName = data.message;
  try {
    await chatRespository.save(newChat);
    socket.join(newChat.id.toString());
    console.log(data.message + ' joined room ' + newChat.id.toString());
    socket.emit('server-message', { type: 'chat-started', message: { id: newChat.id } });
    io.to('employees').emit('server-message', { type: 'chat-started', message: { customerName: data.message, id: newChat.id } });
  } catch (error) {
    socket.emit('server-message', { type: 'error', message: 'Error creating chat' });
    console.error(error);
  }
};
