import express, { NextFunction, Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Employee } from '../entities/employee.entity';
import * as bcrypt from 'bcrypt';
import { format } from 'date-fns';
import { allowRoles } from '../middlewares/verifyRoles';
import { passportVerifyToken } from '../middlewares/passport';
import passport from 'passport';
passport.use('jwt', passportVerifyToken);

const router = express.Router();
const repository = AppDataSource.getRepository(Employee);

/* GET employees */
router.get('/', passport.authenticate('jwt', { session: false }), allowRoles('R1', 'R3'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const employee = await repository.find({
      select: ['id', 'firstName', 'lastName', 'password', 'phoneNumber', 'address', 'photo', 'birthday', 'email', 'roleCode'],
    });

    if (employee.length === 0) {
      return res.status(204).json({ status: 204, message: 'No content' });
    } else {
      return res.status(200).json(employee);
    }
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error', errors: error });
  }
});

/* GET employee by id */
router.get('/:id', passport.authenticate('jwt', { session: false }), allowRoles('R1', 'R3'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const employee = await repository.findOne({
      where: { id: parseInt(req.params.id) },
      select: ['id', 'firstName', 'lastName', 'phoneNumber', 'address', 'photo', 'birthday', 'email', 'roleCode'],
    });
    if (!employee) {
      return res.status(410).json({ message: 'Not found' });
    }

    return res.status(200).json(employee);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error', errors: error });
  }
});

// POST employee
router.post('/', passport.authenticate('jwt', { session: false }), allowRoles('R1', 'R3'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { firstName, lastName, phoneNumber, address, birthday, email, password } = req.body;
    const formattedBirthday = format(new Date(birthday), 'yyyy-MM-dd');
    const employee = await repository.findOneBy({ email: email });
    if (employee) {
      return res.status(400).json({ message: 'Account already exists' });
    }
    const hash = await bcrypt.hash(password, 10);

    const newEmployee = {
      firstName: firstName,
      lastName: lastName,
      phoneNumber: phoneNumber,
      address: address,
      birthday: formattedBirthday,
      email: email,
      password: hash,
    };

    await repository.save(newEmployee);

    const user: any = await repository.findOneBy({ email: email });
    const { password: _, ...tokenEmployee } = user;

    return res.status(200).json(tokenEmployee);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error', errors: error });
  }
});

// PATCH employee
router.patch('/:id', passport.authenticate('jwt', { session: false }), allowRoles('R1', 'R3'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const employee = await repository.findOneBy({ id: parseInt(req.params.id) });
    const { firstName, lastName, phoneNumber, address, birthday, email, password } = req.body;
    const formattedBirthday = format(new Date(birthday), 'yyyy-MM-dd');
    if (!employee) {
      return res.status(410).json({ message: 'Not found' });
    }
    const hash = await bcrypt.hash(password, 10);
    if (employee) {
      employee.firstName = firstName || employee.firstName;
      employee.lastName = lastName || employee.lastName;
      employee.phoneNumber = phoneNumber || employee.phoneNumber;
      employee.password = password || employee.password;
      employee.address = address || employee.address;
      employee.birthday = new Date(formattedBirthday);
      employee.email = email || employee.email;
      if (password) {
        employee.password = hash;
      }
      const updatedEmployee = await repository.save(employee);
      const { password: _, ...updatedEmployeeData } = updatedEmployee || {};
      return res.status(200).json(updatedEmployeeData);
    }
  } catch (error: any) {
    return res.status(500).json({ message: 'Internal server error', errors: error });
  }
});

//Delete employee
router.delete('/:id', passport.authenticate('jwt', { session: false }), allowRoles('R1', 'R3'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const employee = await repository.findOneBy({ id: parseInt(req.params.id) });
    if (!employee) {
      return res.status(410).json({ message: 'Not found' });
    }
    await repository.delete({ id: parseInt(req.params.id) });
    res.status(200).json({ message: 'Employee deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});
export default router;
