const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const LocalStrategy = require('passport-local').Strategy;

import { Customer } from '../entities/customer.entity';
import { Employee } from '../entities/employee.entity'; // Import Employee entity
import { AppDataSource } from '../data-source';

const customerRepository = AppDataSource.getRepository(Customer);
const employeeRepository = AppDataSource.getRepository(Employee);

const passportVerifyToken = new JwtStrategy(
  {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken('Authorization'),
    secretOrKey: process.env.SECRET,
  },
  async (payload: any, done: any) => {
    try {
      let user: any = await customerRepository.findOneBy({ email: payload.email });
      if (!user) {
        user = await employeeRepository.findOneBy({ email: payload.email });
      }
      if (!user) {
        return done(null, false);
      }
      return done(null, user);
    } catch (error) {
      done(error, false);
    }
  },
);

const passportVerifyAccount = new LocalStrategy(
  {
    usernameField: 'email',
  },
  async (email: string, passwordInput: string, done: any) => {
    try {
      // Tìm người dùng trong cả hai repositories
      let user: any = await customerRepository.findOneBy({ email: email });
      if (!user) {
        user = await employeeRepository.findOneBy({ email: email });
      }
      if (!user) {
        return done(null, false, { message: 'Email not found' }); // Không tìm thấy người dùng
      }

      // Validate password using the user object's method
      const isCorrectPassword = await user.validatePassword(passwordInput);
      if (!isCorrectPassword) {
        return done(null, false, { message: 'Incorrect password' }); // Mật khẩu không chính xác
      }

      const { password, ...userWithoutPassword } = user;
      // Người dùng xác thực thành công
      return done(null, userWithoutPassword);
    } catch (error) {
      return done(error, false);
    }
  },
);

export { passportVerifyToken, passportVerifyAccount };
