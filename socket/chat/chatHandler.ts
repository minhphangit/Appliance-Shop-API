import { Server, Socket } from 'socket.io';
import { chatStart } from './chatStart';
import { chatAccept } from './chatAccept';
import { sendMessage } from './sendMessage';
import { chatClose } from './chatClose';
import { AppDataSource } from '../../data-source';
import { Chat } from '../../entities/chat.entity';

export type socketData = {
  type: string;
  message: any;
};

const chatRespository = AppDataSource.getRepository(Chat);

export const chatHandler = async (io: Server, socket: any) => {
  socket.on('employee-message', async (data: socketData) => {
    if (socket.request.user?.roleCode !== 'R3' && socket.request.user?.roleCode !== 'R1') {
      return;
    }
    if (data.type === 'employee-connected') {
      socket.join('employees');
      console.log(socket.request.user.email + ' joined employees room');
      const chatRooms = await chatRespository.find({ where: { employeeId: socket.request.user?.id, isFinished: false } });
      if (chatRooms.length > 0) {
        chatRooms.forEach((chat) => {
          socket.join(chat.id.toString());
          console.log(socket.request.user.email + ' joined room ' + chat.id.toString());
        });
      }
    }
    if (data.type === 'chat-accepted') {
      console.log('employee accepted chat');
      chatAccept(socket, io, data);
    }
    if (data.type === 'new-message') {
      console.log('employee sent a message');
      sendMessage(socket, io, data, 'employee');
    }
  });
  socket.on('client-message', (data: socketData) => {
    if (data.type === 'start-chat') {
      chatStart(socket, io, data);
    }
    if (data.type === 'customer-connected') {
      socket.join(data.message.toString());
      console.log('customer joined room ' + data.message.toString());
    }
    if (data.type === 'new-message') {
      console.log('client sent a message');
      sendMessage(socket, io, data, 'customer');
    }
    if (data.type === 'close-chat') {
      console.log('client closed chat');
      chatClose(socket, io, data);
    }
  });
  return () => {
    socket.off('employee-message');
    socket.off('client-message');
  };
};
