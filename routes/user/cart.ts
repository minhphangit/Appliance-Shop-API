import express, { NextFunction, Response } from 'express';
const cartRouter = express.Router();
import passport from 'passport';
import { passportVerifyToken } from '../../middlewares/passport';
import { AppDataSource } from '../../data-source';
import { Cart } from '../../entities/cart.entity';

passport.use('user', passportVerifyToken);

const cartRepository = AppDataSource.getRepository(Cart);

/* GET cart */

cartRouter.get('/', passport.authenticate('user', { session: false }), async (req: any, res: Response, next: NextFunction) => {
  try {
    const customerId = req.user.id;
    const carts = await cartRepository
      .createQueryBuilder('cart')
      .leftJoinAndSelect('cart.product', 'product')
      .where('cart.customerId = :customerId', { customerId })
      .getMany();
    res.status(200).json(carts);
  } catch (error: any) {
    console.log(error);
    res.status(500).json({ message: 'Database Error' });
  }
});

/* POST cart */

cartRouter.post('/', passport.authenticate('user', { session: false }), async (req: any, res: Response, next: NextFunction) => {
  try {
    const customerId = req.user.id;
    req.body.forEach(async (item: any) => {
      const { productId, quantity } = item;
      const cart = await cartRepository.findOne({ where: { customerId, productId } });
      if (cart) {
        cart.quantity = quantity;
        await cartRepository.save(cart);
      } else {
        await cartRepository.save({ customerId, productId, quantity });
      }
    });
    res.status(200).json({ message: 'Add to cart successfully' });
  } catch (error: any) {
    console.log(error);
    res.status(500).json({ message: 'Database Error' });
  }
});

/* DELETE cart */

cartRouter.delete('/:id', passport.authenticate('user', { session: false }), async (req: any, res: Response, next: NextFunction) => {
  try {
    const customerId = req.user.id;
    const productId = req.params.id;
    const cart = await cartRepository.findOne({ where: { customerId, productId } });
    if (cart) {
      await cartRepository.remove(cart);
      res.status(200).json({ message: 'Remove from cart successfully' });
    } else {
      res.status(404).json({ message: 'Not found' });
    }
  } catch (error: any) {
    console.log(error);
    res.status(500).json({ message: 'Database Error' });
  }
});

export default cartRouter;
