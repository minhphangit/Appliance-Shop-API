import express, { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Voucher } from '../entities/voucher.entity';
import { Customer } from '../entities/customer.entity';
import { CustomerVoucher } from '../entities/customer-voucher.entity';
const router = express.Router();
const repository = AppDataSource.getRepository(Voucher);
import { format } from 'date-fns';
import { allowRoles } from '../middlewares/verifyRoles';
import { passportVerifyToken } from '../middlewares/passport';
import passport from 'passport';
passport.use('jwt', passportVerifyToken);

// get vouchers for customer
router.get(
  '/get-vouchers-for-customer/:customerId',
  passport.authenticate('jwt', { session: false }),
  allowRoles('R1', 'R2', 'R3'),
  async (req: Request, res: Response) => {
    try {
      const { customerId } = req.params;
      const customerRepository = AppDataSource.getRepository(Customer);
      const customer = await customerRepository.findOne({ where: { id: parseInt(customerId) } });

      if (!customer) {
        return res.status(410).json({ message: 'Customer not found' });
      }

      const customerVoucherRepository = AppDataSource.getRepository(CustomerVoucher);
      const customerVouchers = await customerVoucherRepository.find({ where: { customerId: parseInt(customerId) } });

      if (customerVouchers.length === 0) {
        return res.status(204).json({ message: 'No vouchers found for customer' });
      }
      res.status(200).json(customerVouchers);
    } catch (error: any) {
      console.log('««««« error »»»»»', error);
      res.status(500).json({ error: 'Internal server error', errors: error });
    }
  },
);

//Add voucher for customer
router.post('/add-voucher-for-customer', passport.authenticate('jwt', { session: false }), allowRoles('R1', 'R3'), async (req: Request, res: Response) => {
  try {
    const { customerId, voucherCode } = req.body;
    const customerRepository = AppDataSource.getRepository(Customer);
    const customer = await customerRepository.findOne({ where: { id: customerId } });

    if (!customer) {
      return res.status(410).json({ message: 'Customer not found' });
    }
    const voucherRepository = AppDataSource.getRepository(Voucher);
    const voucher = await voucherRepository.findOne({ where: { voucherCode: voucherCode } });
    if (!voucher) {
      return res.status(410).json({ message: 'Voucher not found' });
    }

    const customerVoucherRepository = AppDataSource.getRepository(CustomerVoucher);
    const newCustomerVoucher = new CustomerVoucher();
    newCustomerVoucher.customerId = customerId;
    newCustomerVoucher.voucherId = voucher.id;
    newCustomerVoucher.voucherCode = voucherCode;

    await customerVoucherRepository.save(newCustomerVoucher);
    res.status(200).json({ message: 'Voucher added for customer' });
  } catch (error: any) {
    console.log('««««« error »»»»»', error);
    res.status(500).json({ error: 'Internal server error', errors: error });
  }
});

/* GET vouchers */
router.get('/', async (req: Request, res: Response, next: any) => {
  try {
    const vouchers = await repository.find();
    if (vouchers.length === 0) {
      res.status(204).json({ message: 'No vouchers found' });
    } else {
      res.status(200).json(vouchers);
    }
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error', errors: error });
  }
});

/* GET voucher by id */
router.get('/:id', async (req: Request, res: Response, next: any) => {
  try {
    const voucher = await repository.findOneBy({ id: parseInt(req.params.id) });
    if (!voucher) {
      return res.status(410).json({ message: 'Not found' });
    }
    return res.status(200).json(voucher);
  } catch (error: any) {
    console.log('««««« error »»»»»', error);
    res.status(500).json({ error: 'Internal server error', errors: error });
  }
});

/* POST voucher */
router.post('/', passport.authenticate('jwt', { session: false }), allowRoles('R1', 'R3'), async (req: Request, res: Response, next: any) => {
  try {
    const { voucherCode, discountPercentage, startDate, expiryDate, maxUsageCount } = req.body;

    if (!voucherCode || !discountPercentage || !startDate || !expiryDate || !maxUsageCount) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    if (discountPercentage < 0 || discountPercentage > 100) {
      return res.status(400).json({ message: 'Discount percentage must be between 0 and 100' });
    }

    if (startDate > expiryDate) {
      return res.status(400).json({ message: 'Start date must be before expiry date' });
    }

    if (maxUsageCount < 0) {
      return res.status(400).json({ message: 'Max usage count must be a positive number' });
    }

    if (maxUsageCount < 0 || maxUsageCount > 100) {
      return res.status(400).json({ message: 'Max usage count must be between 0 and 100' });
    }

    const voucher = await repository.findOneBy({ voucherCode });
    if (voucher) {
      return res.status(400).json({ message: 'Voucher already exists' });
    }
    const startDateBirthday = format(new Date(startDate), 'yyyy-MM-dd');
    const expiryDateBirthday = format(new Date(expiryDate), 'yyyy-MM-dd');
    let newVoucher = new Voucher();
    newVoucher = {
      ...newVoucher,
      ...req.body,
      remainingUsageCount: maxUsageCount,
      startDate: startDateBirthday,
      expiryDate: expiryDateBirthday,
    };

    const voucherCreated = await repository.save(newVoucher);
    res.status(201).json(voucherCreated);
  } catch (error: any) {
    console.log(error);
    res.status(500).json({ error: 'Internal server error', errors: error });
  }
});

/* PATCH voucher */
router.patch('/:id', passport.authenticate('jwt', { session: false }), allowRoles('R1', 'R3'), async (req: Request, res: Response, next: any) => {
  try {
    const voucher = await repository.findOneBy({ id: parseInt(req.params.id) });
    if (!voucher) {
      return res.status(410).json({ message: 'Not found' });
    }
    const { voucherCode, discountPercentage, startDate, expiryDate, maxUsageCount, voucherType } = req.body;

    const startDateBirthday = format(new Date(startDate), 'yyyy-MM-dd');
    const expiryDateBirthday = format(new Date(expiryDate), 'yyyy-MM-dd');
    const voucherUpdated = await repository.save({
      ...voucher,
      startDate: startDateBirthday,
      expiryDate: expiryDateBirthday,
      remainingUsageCount: maxUsageCount,
      voucherCode: voucherCode || voucher.voucherCode,
      discountPercentage: discountPercentage || voucher.discountPercentage,
      voucherType: voucher.voucherType || voucherType,
    });
    res.status(200).json(voucherUpdated);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error', errors: error });
  }
});

/* DELETE voucher */
router.delete('/:id', passport.authenticate('jwt', { session: false }), allowRoles('R1', 'R3'), async (req: Request, res: Response, next: any) => {
  try {
    const voucher = await repository.findOneBy({ id: parseInt(req.params.id) });
    if (!voucher) {
      return res.status(410).json({ message: 'Not found' });
    }
    await repository.remove(voucher);
    res.status(200).json({ message: 'Voucher deleted' });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error', errors: error });
  }
});

/* apply Voucher To Order */
router.post('/apply-voucher', async (req: Request, res: Response, next: any) => {
  try {
    const { voucherCode } = req.body;
    const voucher = await repository.findOneBy({ voucherCode });
    if (!voucher) {
      return res.status(410).json({ message: 'Voucher not found' });
    }
    if (voucher.expiryDate < new Date() || voucher.remainingUsageCount <= 0) {
      return res.status(400).json({ message: 'Invalid voucher' });
    }

    voucher.remainingUsageCount -= 1;
    await repository.save(voucher);
    res.status(200).json({ message: 'Voucher applied to order' });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error', errors: error });
  }
});

export default router;
