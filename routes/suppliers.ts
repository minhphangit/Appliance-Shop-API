import express, { Express, NextFunction, Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Supplier } from '../entities/supplier.entity';
import { allowRoles } from '../middlewares/verifyRoles';
import { passportVerifyToken } from '../middlewares/passport';
import passport from 'passport';
passport.use('jwt', passportVerifyToken);

const router = express.Router();

const repository = AppDataSource.getRepository(Supplier);

/* GET suppliers */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const suppliers = await repository.find();
    if (suppliers.length === 0) {
      res.status(204).json({ message: 'No suppliers' });
    } else {
      res.status(200).json(suppliers);
    }
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error', errors: error });
  }
});

/* GET supplier by id */
router.get('/:id', async (req: Request, res: Response, next: any) => {
  try {
    const supplier = await repository.findOneBy({ id: parseInt(req.params.id) });
    if (!supplier) {
      return res.status(404).json({ message: 'Not found' });
    }
    res.status(200).json(supplier);
  } catch (error: any) {
    res.status(500).json({ message: 'Internal server error', errors: error });
  }
});

/* POST supplier */
router.post('/', passport.authenticate('jwt', { session: false }), allowRoles('R1', 'R3'), async (req: Request, res: Response, next: any) => {
  try {
    const { name } = req.body;
    const exitsSupplier = await repository.findOneBy({ name });
    if (exitsSupplier) {
      return res.status(400).json({ message: 'Supplier already exists' });
    }
    const supplier = new Supplier();
    Object.assign(supplier, req.body);
    await repository.save(supplier);
    res.status(201).json(supplier);
  } catch (error: any) {
    res.status(500).json({ message: 'Internal server error', errors: error });
  }
});

/* PATCH supplier */
router.patch('/:id', passport.authenticate('jwt', { session: false }), allowRoles('R1', 'R3'), async (req: Request, res: Response, next: any) => {
  try {
    const supplier = await repository.findOneBy({ id: parseInt(req.params.id) });
    if (!supplier) {
      return res.status(404).json({ message: 'Not found' });
    }

    Object.assign(supplier, req.body);
    await repository.save(supplier);

    const updatedSupplier = await repository.findOneBy({ id: parseInt(req.params.id) });
    res.status(200).json(updatedSupplier);
  } catch (error: any) {
    res.status(500).json({ message: 'Internal server error', errors: error });
  }
});

/* DELETE supplier */
router.delete('/:id', passport.authenticate('jwt', { session: false }), allowRoles('R1', 'R3'), async (req: Request, res: Response, next: any) => {
  try {
    const supplier = await repository.findOneBy({ id: parseInt(req.params.id) });
    if (!supplier) {
      return res.status(404).json({ message: 'Not found' });
    }
    await repository.delete({ id: supplier.id });
    res.status(200).json({ message: 'Deleted supplier successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Internal server error', errors: error });
  }
});

export default router;
