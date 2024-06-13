import { Server } from 'socket.io';
import { AppDataSource } from '../../data-source';
import { Chat } from '../../entities/chat.entity';
import { socketData } from './chatHandler';

const chatRespository = AppDataSource.getRepository(Chat);

export const chatAccept = async (socket: any, io: Server, data: socketData) => {
  try {
    let chat = await chatRespository.findOneBy({ id: data.message.id });
    if (chat) {
      chat.employeeId = socket.request.user.id;
      await chatRespository.save(chat);
      socket.join(chat.id.toString());
      console.log(socket.request.user.email + ' joined room ' + chat.id.toString());
      io.to('employees').emit('assigned', { type: 'chat-accepted', message: { customerName: chat.customerName, id: chat.id } });
      console.log('Chat accepted');
    } else {
      socket.emit('server-message', { type: 'error', message: 'Chat not found' });
      console.log('Chat not found');
    }
  } catch (error) {
    socket.emit('server-message', { type: 'error', message: 'Database Error' });
    console.error(error);
  }
};
