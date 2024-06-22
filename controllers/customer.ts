import { Customer } from '../entities/customer.entity';
import { AppDataSource } from '../data-source';
import { MoreThan } from 'typeorm';
import { generateToken, generateRefreshToken } from '../utils/jwtHelper';
import * as bcrypt from 'bcrypt';
import { format } from 'date-fns';
import JWT from 'jsonwebtoken';

const repository = AppDataSource.getRepository(Customer);
import sendMail from '../utils/sendMail';
import axios from 'axios';
const crypto = require('crypto');
const asyncHandler = require('express-async-handler');

//Verify Recaptcha
const verifyRecaptcha = asyncHandler(async (req: any, res: any, next: any) => {
  const { recaptchaToken } = req.body;
  if (!recaptchaToken) {
    return res.status(400).json({ message: 'Recaptcha token is required' });
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
      return res.status(400).json({ message: 'Recaptcha verification failed' });
    }
    return next();
  } catch (error) {
    return res.status(500).json({ message: 'recaptcha verification error', error: error });
  }
});

const login = asyncHandler(async (req: any, res: any, next: any) => {
  try {
    const authenticatedUser = req.user;
    const token = generateToken(authenticatedUser);
    const user: any = await repository.findOneBy({ email: authenticatedUser.email });
    const { password: _, ...tokenCustomer } = user;
    const refreshToken = generateRefreshToken(user.id);
    const payload = {
      message: 'Login successfully',
      data: { customer: tokenCustomer, token, refreshToken },
    };
    return res.status(200).json({ status: 200, payload });
  } catch (error: any) {
    return res.status(500).json({ message: 'Internal server error', errors: error });
  }
});

const register = asyncHandler(async (req: any, res: any) => {
  try {
    const { firstName, lastName, phoneNumber, address, birthday, email, password } = req.body;
    // const formattedBirthday = format(new Date(birthday), 'yyyy-MM-dd');
    const customer = await repository.findOneBy({ email: email });
    if (customer) {
      return res.status(400).json({ message: 'Account already exists' });
    }
    const hash = await bcrypt.hash(password, 10);

    const newCustomer = {
      firstName: firstName,
      lastName: lastName,
      phoneNumber: phoneNumber,
      // address: address,
      // birthday: formattedBirthday,
      email: email,
      password: hash,
    };

    await repository.save(newCustomer);

    const user: any = await repository.findOneBy({ email: email });
    const { password: _, ...tokenCustomer } = user;
    const token = generateToken(tokenCustomer);
    const refreshToken = generateRefreshToken(user.id);
    const payload = {
      message: 'Register successfully',
      data: { customer: tokenCustomer, token, refreshToken },
    };
    return res.status(200).json({ status: 200, payload });
  } catch (error: any) {
    return res.status(500).json({ message: 'Internal server error', errors: error });
  }
});

const refreshToken = asyncHandler(async (req: any, res: any) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }
    JWT.verify(refreshToken, process.env.SECRET as string, async (err: any, user: any) => {
      if (err) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const { id } = user;
      const customer = await repository.findOneBy({ id: id });
      if (customer) {
        const { firstName, lastName, phoneNumber, address, birthday, email } = customer;
        const tokenCustomer = {
          firstName: firstName,
          lastName: lastName,
          phoneNumber: phoneNumber,
          address: address,
          birthday: birthday,
          email: email,
        };
        const token = generateToken(tokenCustomer);
        const payload = {
          message: 'Refresh token successfully',
          data: { customer: tokenCustomer, token },
        };
        return res.status(200).json({ status: 200, payload });
      }
      return res.status(401).json({ error: 'Unauthorized' });
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Internal server error', errors: error });
  }
});

const loginSuccess = asyncHandler(async (req: any, res: any) => {
  try {
    const { email } = req?.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const customer = await repository.findOneBy({ email: email });
    if (customer) {
      const token = generateToken(customer);
      const refreshToken = generateRefreshToken(customer.email);
      const { password: _, ...tokenCustomer } = customer;
      const payload = {
        message: 'Login successfully',
        data: { customer: tokenCustomer, token, refreshToken },
      };
      return res.status(200).json({ status: 200, payload });
    }
  } catch (error: any) {
    return res.status(500).json({ error: 'Internal server error', errors: error });
  }
});
const forgotPassword = asyncHandler(async (req: any, res: any) => {
  try {
    const { email } = req.body;
    if (!email) throw new Error('Missing email');
    const customer = await repository.findOneBy({ email: email });
    if (!customer) {
      return res.status(404).json({ message: 'Email not found' });
    }

    const resetToken = customer.createPasswordChangedToken();
    await repository.save(customer);

    const html = `Nếu bạn thực hiện đặt lại mật khẩu cho tài khoản cửa hàng đồ gia dụng
      thì nhấn vào link sau đây để đặt lại mật khẩu cho tài khoản email của mình:
      Link này sẽ hết hạn sau 15 phút kể từ bây giờ.
      <a href=${process.env.CLIENT_URL}/reset-password/?token=${resetToken}> Nhấn vào đây</a>
      `;
    const data = {
      email: email,
      html,
    };
    const rs = await sendMail(data);
    return res.status(200).json({
      success: true,
      rs,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

const resetPassword = asyncHandler(async (req: any, res: any) => {
  const { password, token } = req.body;
  if (!password || !token) throw new Error('Missing inputs');

  const passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  const customer = await repository.findOne({
    where: {
      passwordResetToken,
      passwordResetExpires: MoreThan(Date.now()),
    },
  });

  if (!customer) {
    return res.status(401).json({ message: 'Thời gian đặt lại mật khẩu đã hết hạn' });
  }

  customer.password = password;
  customer.passwordResetToken = '';
  customer.passwordChangedAt = new Date().toISOString();
  customer.passwordResetExpires = null as any;

  await repository.save(customer);

  return res.status(200).json({
    success: true,
    message: 'Updated password',
  });
});

export { forgotPassword, resetPassword, login, register, refreshToken, loginSuccess, verifyRecaptcha };
