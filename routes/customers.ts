import express, { NextFunction, Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Customer } from '../entities/customer.entity';
import * as bcrypt from 'bcrypt';
import { format } from 'date-fns';
const router = express.Router();
const repository = AppDataSource.getRepository(Customer);
import cloudinary from '../utils/cloudinary';
import { uploadCloud } from '../middlewares/fileMulter';
import { allowRoles } from '../middlewares/verifyRoles';
import { passportVerifyToken } from '../middlewares/passport';
import passport from 'passport';
passport.use('jwt', passportVerifyToken);

/* GET customers */
router.get('/', passport.authenticate('jwt', { session: false }), allowRoles('R1', 'R3'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await repository.find({
      select: ['id', 'firstName', 'lastName', 'password', 'phoneNumber', 'address', 'photo', 'birthday', 'email', 'roleCode'],
    });

    if (customer.length === 0) {
      return res.status(204).json({ status: 204, message: 'No content' });
    } else {
      return res.status(200).json(customer);
    }
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error', errors: error });
  }
});

/* GET customer by id */
router.get('/:id', passport.authenticate('jwt', { session: false }), allowRoles('R1', 'R3', 'R2'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await repository.findOne({
      where: { id: parseInt(req.params.id) },
      select: ['id', 'firstName', 'lastName', 'phoneNumber', 'address', 'photo', 'birthday', 'email', 'roleCode'],
    });
    if (!customer) {
      return res.status(410).json({ message: 'Not found' });
    }

    return res.status(200).json(customer);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error', errors: error });
  }
});

// POST customer
router.post('/', passport.authenticate('jwt', { session: false }), allowRoles('R1', 'R3'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { firstName, lastName, phoneNumber, address, birthday, email, password } = req.body;
    const formattedBirthday = format(new Date(birthday), 'yyyy-MM-dd');
    const customer = await repository.findOneBy({ email: email });
    if (customer) {
      return res.status(400).json({ message: 'Account already exists' });
    }
    const hash = await bcrypt.hash(password, 10);

    const newCustomer = {
      firstName: firstName,
      lastName: lastName,
      phoneNumber: phoneNumber,
      address: address,
      birthday: formattedBirthday,
      email: email,
      password: hash,
    };

    await repository.save(newCustomer);

    const user: any = await repository.findOneBy({ email: email });
    const { password: _, ...tokenCustomer } = user;

    return res.status(200).json(tokenCustomer);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error', errors: error });
  }
});

// PATCH customer
router.patch(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  allowRoles('R1', 'R2', 'R3'),
  uploadCloud.single('photo'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const customer = await repository.findOneBy({ id: parseInt(req.params.id) });
      const { firstName, lastName, phoneNumber, address, birthday, email, password } = req.body;
      const formattedBirthday = format(new Date(birthday), 'yyyy-MM-dd');

      if (!customer) {
        return res.status(410).json({ message: 'Not found' });
      }

      const customerCopy: any = { ...customer };
      if (req.file) {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'customers',
        });

        customerCopy.photo = result.secure_url;

        if (customer.photo) {
          await cloudinary.uploader.destroy(customer.photo);
        }
      }
      const updatedCustomer = repository.merge(customerCopy, {
        firstName,
        lastName,
        phoneNumber,
        address,
        birthday: new Date(formattedBirthday),
        email,
        password: password ? await bcrypt.hash(password, 10) : customer.password,
      });
      const savedCustomer = await repository.save(updatedCustomer);
      const { password: _, ...updatedCustomerData } = savedCustomer || {};
      return res.status(200).json(updatedCustomerData);
    } catch (error: any) {
      console.log('««««« error »»»»»', error);
      return res.status(500).json({ message: 'Internal server error', errors: error });
    }
  },
);
router.patch('/change-password/:id', passport.authenticate('jwt', { session: false }), allowRoles('R1', 'R2', 'R3'), async (req: Request, res: Response) => {
  const { oldPassword, newPassword } = req.body;
  try {
    const user = await repository.findOne({
      where: {
        id: parseInt(req.params.id),
      },
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Kiểm tra nếu mật khẩu là NULL
    if (user.password === null) {
      // Nếu mật khẩu là NULL, cho phép thiết lập mật khẩu mới
      user.password = newPassword;
      await repository.save(user);
      return res.status(200).json({ message: 'Password set successfully' });
    }
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid old password' });
    }
    user.password = newPassword;
    await repository.save(user);
    return res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});
//Delete customer
router.delete('/:id', passport.authenticate('jwt', { session: false }), allowRoles('R1', 'R3'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await repository.findOneBy({ id: parseInt(req.params.id) });
    if (!customer) {
      return res.status(410).json({ message: 'Not found' });
    }
    await repository.delete({ id: parseInt(req.params.id) });
    res.status(200).json({ message: 'Customer deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});
export default router;
