import { Server } from 'socket.io';
import { AppDataSource } from '../../data-source';
import { Chat } from '../../entities/chat.entity';
import { socketData } from './chatHandler';
import { Message } from '../../entities/message.model';
import { create } from 'domain';

const chatRespository = AppDataSource.getRepository(Chat);

export const sendMessage = async (socket: any, io: Server, data: socketData, sender: string) => {
  try {
    let chatId = data.message.chatId;
    let newMessage = { ...data.message, sender: sender };
    io.to(chatId.toString()).emit('new-message', { ...newMessage, createdAt: Date.now() });
    console.log('Message sent to room ' + chatId.toString());
    let chat = await chatRespository.findOneBy({ id: data.message.chatId });
    if (chat) {
      if (chat.isFinished) {
        return socket.emit('server-message', { type: 'error', message: 'Chat is closed' });
      }
      const newItem = new Message(newMessage);
      try {
        let result = await newItem.save();
      } catch (error) {
        console.log(error);
        return socket.emit('server-message', { type: 'error', message: 'Error sending message' });
      }
    } else {
      return socket.emit('server-message', { type: 'error', message: 'Chat not found' });
    }
  } catch (error) {
    socket.emit('server-message', { type: 'error', message: 'Database Error' });
    console.error(error);
  }
};
