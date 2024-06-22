import axios from 'axios';

export const socketVerfiyCaptcha = async (packet: any, socket: any, next: any) => {
  if (packet[0] === 'client-message' && packet[1].type === 'start-chat') {
    const { recaptchaToken } = packet[1].message;
    if (!recaptchaToken) {
      return socket.emit('error', { message: 'Recaptcha token is required' });
    }

    try {
      const response = await axios.post(`https://www.google.com/recaptcha/api/siteverify`, null, {
        params: {
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: recaptchaToken,
        },
      });

      const { success } = response.data;
      if (!success) {
        return socket.emit('error', { message: 'Recaptcha verification failed' });
      }
      return next();
    } catch (error) {
      return socket.emit('error', { message: 'Recaptcha verification error', error: error });
    }
  }
  return next();
};
