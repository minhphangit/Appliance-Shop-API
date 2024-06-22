import { Server, Socket } from 'socket.io';
import { AppDataSource } from '../../data-source';
import { Chat } from '../../entities/chat.entity';
import { socketData } from './chatHandler';

const chatRespository = AppDataSource.getRepository(Chat);

export const chatStart = async (socket: Socket, io: Server, data: socketData) => {
  try {
    let newChat = new Chat();
    newChat = { ...data.message };
    await chatRespository.save(newChat);
    socket.join(newChat.id.toString());
    console.log(data.message.customerName + ' joined room ' + newChat.id.toString());
    socket.emit('server-message', { type: 'chat-started', message: newChat });
    io.to('employees').emit('server-message', { type: 'chat-started', message: { customerName: data.message.customerName, id: newChat.id } });
  } catch (error) {
    socket.emit('server-message', { type: 'error', message: 'Error creating chat' });
    console.error(error);
  }
};
