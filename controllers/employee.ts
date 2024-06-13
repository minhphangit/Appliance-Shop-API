import { Employee } from '../entities/employee.entity';
import { AppDataSource } from '../data-source';
import { MoreThan } from 'typeorm';
import { generateToken, generateRefreshToken } from '../utils/jwtHelper';
import JWT from 'jsonwebtoken';

const repository = AppDataSource.getRepository(Employee);
import sendMail from '../utils/sendMail';
const crypto = require('crypto');
const asyncHandler = require('express-async-handler');

const login = asyncHandler(async (req: any, res: any, next: any) => {
  try {
    const authenticatedUser = req.user;
    const token = generateToken(authenticatedUser);
    const user: any = await repository.findOneBy({ email: authenticatedUser.email });
    const { password: _, ...tokenEmployee } = user;
    const refreshToken = generateRefreshToken(user.id);
    const payload = {
      message: 'Login successfully',
      data: { employee: tokenEmployee, token, refreshToken },
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
      const employee = await repository.findOneBy({ id: id });
      if (employee) {
        const { firstName, lastName, phoneNumber, address, birthday, email } = employee;
        const tokenEmployee = {
          firstName: firstName,
          lastName: lastName,
          phoneNumber: phoneNumber,
          address: address,
          birthday: birthday,
          email: email,
        };
        const token = generateToken(tokenEmployee);
        const payload = {
          message: 'Refresh token successfully',
          data: { employee: tokenEmployee, token },
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
    const employee = await repository.findOneBy({ email: email });
    if (employee) {
      const token = generateToken(employee);
      const refreshToken = generateRefreshToken(employee.email);
      const { password: _, ...tokenEmployee } = employee;
      const payload = {
        message: 'Login successfully',
        data: { employee: tokenEmployee, token, refreshToken },
      };
      return res.status(200).json({ status: 200, payload });
    }
  } catch (error: any) {
    return res.status(500).json({ error: 'Internal server error', errors: error });
  }
});
const forgotPassword = asyncHandler(async (req: any, res: any) => {
  try {
    const { email } = req.query;
    if (!email) throw new Error('Missing email');
    const employee = await repository.findOneBy({ email: email });
    if (!employee) throw new Error('Employee not found');

    const resetToken = employee.createPasswordChangedToken();
    await repository.save(employee);

    const html = `Nếu bạn thực hiện đặt lại mật khẩu cho tài khoản cửa hàng đồ gia dụng
      thì nhấn vào link sau đây để đặt lại mật khẩu cho tài khoản email của mình:
      Link này sẽ hết hạn sau 15 phút kể từ bây giờ.
      <a href=${process.env.SERVER_URL}/user/auth/reset-password/${resetToken}> Nhấn vào đây</a>
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
  const employee = await repository.findOne({
    where: {
      passwordResetToken,
      passwordResetExpires: MoreThan(Date.now()),
    },
  });

  if (!employee) {
    throw new Error('Invalid reset token');
  }

  employee.password = password;
  employee.passwordResetToken = '';
  employee.passwordChangedAt = new Date().toISOString();
  employee.passwordResetExpires = null as any;

  await repository.save(employee);

  return res.status(200).json({
    success: true,
    message: 'Updated password',
  });
});

export { forgotPassword, resetPassword, login, refreshToken, loginSuccess };
