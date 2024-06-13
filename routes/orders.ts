import express, { Express, NextFunction, Request, Response } from 'express';

import { AppDataSource } from '../data-source';
import { OrderDetail } from '../entities/order-details.entity';
import { Order } from '../entities/order.entity';
import { Customer } from '../entities/customer.entity';
import { Voucher } from '../entities/voucher.entity';
import { Product } from '../entities/product.entity';
import { allowRoles } from '../middlewares/verifyRoles';
import passport from 'passport';
import { passportSocketVerifyToken } from '../middlewares/passportSocket';
import axios from 'axios';

const AnonymousStrategy = require('passport-anonymous').Strategy;
const router = express.Router();
const productRepository = AppDataSource.getRepository(Product);
const customerRepository = AppDataSource.getRepository(Customer);
const orderRepository = AppDataSource.getRepository(Order);
const orderDetailRepository = AppDataSource.getRepository(OrderDetail);
const voucherRepository = AppDataSource.getRepository(Voucher);
passport.use('jwt', passportSocketVerifyToken);
passport.use(new AnonymousStrategy());

var accessKey = 'F8BBA842ECF85';
var secretKey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
var orderInfo = 'thanh toán với ví MoMo';
var partnerCode = 'MOMO';
// var redirectUrl = '${process.env.BASE_URL}/profile/order';
var redirectUrl = `${process.env.SERVER_URL}/profile/order`;
// var ipnUrl = 'https://78bd-2402-800-6279-54a1-d17-a5d3-38b3-9226.ngrok-free.app/orders/callback';
var ipnUrl = `${process.env.SERVER_URL}/orders/callback`;
var requestType = 'payWithMethod';
const crypto = require('crypto');
router.post('/momo-payment', async (req: any, res: Response) => {
  const {
    firstName,
    lastName,
    phoneNumber,
    email,
    shippedDate,
    status,
    description,
    shippingAddress,
    shippingCity,
    paymentType,
    customerId,
    employeeId,
    orderDetails,
    voucherCode,
    voucherId,
  } = req.body;

  let order: Partial<Order> = {
    shippedDate,
    status,
    description,
    shippingAddress,
    shippingCity,
    paymentType,
    customerId,
    employeeId,
    voucherId,
  };

  let percentage = 0;
  try {
    if (email) {
      let customer: any = await customerRepository.findOne({ where: { email } });
      if (customer.roleCode === 'R3' || customer.roleCode === 'R1') {
        order.employeeId = customer.id;
      } else {
        order.customerId = customer.id;
      }
    } else {
      // Anonymous order - Ensure necessary customer information is provided
      if (!phoneNumber || !email || !firstName) {
        return res.status(400).json({ message: 'Vui lòng cung cấp thông tin khách hàng' });
      }
      let customer = await customerRepository.findOne({ where: { email } });
      if (customer) {
        return res.status(400).json({ message: 'Email đã tồn tại, vui lòng dùng email khác hoặc đăng nhập để mua hàng' });
      } else {
        customer = await customerRepository.save({ phoneNumber, email, firstName, lastName });
        order.customerId = customer.id;
      }
    }

    if (voucherCode) {
      const voucher = await voucherRepository.findOne({ where: { voucherCode } });
      if (!voucher) {
        return res.status(400).json({ message: 'Voucher không hợp lệ' });
      }
      order.voucherId = voucher.id;
      percentage = voucher.discountPercentage;
    }

    let totalAmount = 0;

    for (const od of orderDetails) {
      const product = await productRepository.findOne({ where: { id: od.productId } });
      if (!product) {
        return res.status(400).json({ message: 'Sản phẩm không tồn tại' });
      }
      if (product.price !== od.price || product.discount !== od.discount) {
        return res.status(400).json({ message: 'Giá của sản phẩm đã thay đổi, vui lòng thử lại' });
      }
      if (product.stock < od.quantity) {
        return res.status(400).json({ message: 'Số lượng sản phẩm không đủ' });
      }
      product.stock -= od.quantity;
      await productRepository.save(product);
      totalAmount += (product.price * od.quantity * (100 - product.discount)) / 100;
    }

    const newOrder = orderRepository.create(order);
    const savedOrder = await orderRepository.save(newOrder);

    if (orderDetails && orderDetails.length > 0) {
      const orderDetailEntities = orderDetails.map((od: any) => {
        return orderDetailRepository.create({
          ...od,
          order: savedOrder,
        });
      });

      await orderDetailRepository.save(orderDetailEntities);
    }

    let amount = totalAmount;

    // Áp dụng giảm giá voucher (nếu có)
    if (percentage) {
      amount = (amount * (100 - percentage)) / 100;
    }
    const orderId = `${savedOrder.id}` + new Date().getTime();
    const requestId = orderId;
    const extraData = '';
    const orderGroupId = '';
    const autoCapture = true;
    const lang = 'vi';
    const rawSignature =
      'accessKey=' +
      accessKey +
      '&amount=' +
      amount +
      '&extraData=' +
      extraData +
      '&ipnUrl=' +
      ipnUrl +
      '&orderId=' +
      orderId +
      '&orderInfo=' +
      orderInfo +
      '&partnerCode=' +
      partnerCode +
      '&redirectUrl=' +
      redirectUrl +
      '&requestId=' +
      requestId +
      '&requestType=' +
      requestType;

    const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

    const requestBody = JSON.stringify({
      partnerCode: partnerCode,
      partnerName: 'Test',
      storeId: 'MomoTestStore',
      requestId: requestId,
      amount: amount,
      orderId: orderId,
      orderInfo: orderInfo,
      redirectUrl: redirectUrl,
      ipnUrl: ipnUrl,
      lang: lang,
      requestType: requestType,
      autoCapture: autoCapture,
      extraData: extraData,
      orderGroupId: orderGroupId,
      signature: signature,
    });

    const options = {
      method: 'POST',
      url: 'https://test-payment.momo.vn/v2/gateway/api/create',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody),
      },
      data: requestBody,
    };

    let result;
    try {
      result = await axios(options);
      return res.status(200).json(result.data);
    } catch (error) {
      return res.status(500).json({
        statusCode: 500,
        message: 'Server error',
      });
    }
  } catch (error) {
    console.log('««««« error »»»»»', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi tạo đơn hàng mới.' });
  }
});

router.post('/callback', async (req: Request, res: Response) => {
  const { resultCode, orderId } = req.body;

  if (resultCode === 0) {
    try {
      const order = await orderRepository.findOne({ where: { id: orderId.substring(0, 2) } });
      if (order) {
        order.status = 'COMPLETED';
        await orderRepository.save(order);
        return res.status(200).json({ message: 'Order status updated to complete.' });
      } else {
        return res.status(400).json({ message: 'Order not found.' });
      }
    } catch (error) {
      console.log('««««« error »»»»»', error);
      return res.status(500).json({ message: 'Error updating order status.' });
    }
  } else {
    return res.status(400).json({ message: 'Payment not successful.' });
  }
});

router.post('/transaction-status', async (req, res) => {
  const { orderId } = req.body;

  const rawSignature = `accessKey=${accessKey}&orderId=${orderId}&partnerCode=MOMO&requestId=${orderId}`;

  const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

  const requestBody = JSON.stringify({
    partnerCode: 'MOMO',
    requestId: orderId,
    orderId: orderId,
    signature: signature,
    lang: 'vi',
  });

  const options = {
    method: 'POST',
    url: 'https://test-payment.momo.vn/v2/gateway/api/query',
    headers: {
      'Content-Type': 'application/json',
    },
    data: requestBody,
  };

  let result = await axios(options);
  return res.status(200).json(result.data);
});
// Search orders based on a keyword (product name or order ID)
router.get('/search', async (req: Request, res: Response) => {
  const { keyword } = req.query;

  if (!keyword) {
    return res.status(400).json({ message: 'Keyword is required for searching' });
  }

  try {
    const queryBuilder = orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.employee', 'employee')
      .leftJoinAndSelect('order.orderDetails', 'orderDetails')
      .leftJoinAndSelect('orderDetails.product', 'product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.supplier', 'supplier');

    const keywordNumber = parseInt(keyword as string, 10);

    if (!isNaN(keywordNumber)) {
      queryBuilder.where('order.id = :orderId', { orderId: keywordNumber });
    }

    queryBuilder.orWhere('product.name LIKE :keyword', { keyword: `%${keyword}%` });

    const orders = await queryBuilder
      .select([
        'order.id',
        'order.createdDate',
        'order.shippedDate',
        'order.shippingAddress',
        'order.shippingCity',
        'order.paymentType',
        'order.status',
        'order.description',
        'order.customerId',
        'order.employeeId',
        'customer',
        'employee',
        'orderDetails.quantity',
        'orderDetails.price',
        'orderDetails.discount',
        'product',
        'category',
        'supplier',
      ])
      .getMany();

    if (orders.length === 0) {
      return res.status(404).json({ message: 'No orders found' });
    }

    res.status(200).json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while searching for orders' });
  }
});

/* GET orders */
router.get('/', passport.authenticate('jwt', { session: false }), async (req: Request, res: Response, next: any) => {
  try {
    // SELECT * FROM [Products] AS 'product'
    const orders = await orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.employee', 'employee')
      .leftJoinAndSelect('order.orderDetails', 'orderDetails')
      .leftJoinAndSelect('orderDetails.product', 'product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.supplier', 'supplier')
      .select([
        'order.id',
        'order.createdDate',
        'order.shippedDate',
        'order.shippingAddress',
        'order.shippingCity',
        'order.paymentType',
        'order.status',
        'order.description',
        'order.customerId',
        'order.employeeId',
        'order.voucherId',
        'customer',
        'employee',
        'orderDetails.quantity',
        'orderDetails.price',
        'orderDetails.discount',
        'product',
        'category',
        'supplier',
      ])
      .getMany();

    if (orders.length === 0) {
      res.sendStatus(204);
    } else {
      res.status(200).json(orders);
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Internal server error', errors: error });
  }
});

// Get order by customer email or phone number
router.get('/customer-orders', async (req: Request, res: Response) => {
  const { email, phoneNumber } = req.query;
  try {
    let customer: Customer | null = null;

    if (email) {
      customer = await customerRepository.findOne({ where: { email: email as string } });
    } else if (phoneNumber) {
      customer = await customerRepository.findOne({ where: { phoneNumber: phoneNumber as string } });
    } else {
      return res.status(400).json({ message: 'Email hoặc số điện thoại không chính xác' });
    }

    if (!customer) {
      return res.status(404).json({ message: 'Không tìm thấy khách hàng' });
    }
    const orders = await orderRepository.find({ where: { customer }, relations: ['orderDetails', 'orderDetails.product'] });
    if (orders.length === 0) {
      return res.status(204).json({ message: 'Không có đơn hàng nào' });
    }
    res.status(200).json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy danh sách đơn hàng' });
  }
});
// GET /orders/customer/:customerId
router.get('/customer/:customerId', passport.authenticate('jwt', { session: false }), async (req: Request, res: Response) => {
  const customerId = parseInt(req.params.customerId, 10);

  try {
    // Tìm khách hàng theo customerId
    const customer = await customerRepository.findOne({ where: { id: customerId } });
    if (!customer) {
      return res.status(404).json({ message: 'Không tìm thấy khách hàng.' });
    }

    // Lấy danh sách đơn hàng của khách hàng
    const orders = await orderRepository.find({
      where: { customer },
      relations: ['orderDetails', 'orderDetails.product'],
    });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy danh sách đơn hàng.' });
  }
});

//Get order by id
router.get('/:id', passport.authenticate('jwt', { session: false }), async (req: any, res: Response, next: any) => {
  try {
    // SELECT * FROM [Products] AS 'product'
    const order = await orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.employee', 'employee')
      .leftJoinAndSelect('order.orderDetails', 'orderDetails')
      .leftJoinAndSelect('orderDetails.product', 'product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.supplier', 'supplier')
      .where('order.id = :id', { id: req.params.id })
      .select([
        'order.id',
        'order.createdDate',
        'order.shippedDate',
        'order.shippingAddress',
        'order.shippingCity',
        'order.paymentType',
        'order.status',
        'order.description',
        'order.customerId',
        'order.employeeId',
        'customer',
        'employee',
        'orderDetails.quantity',
        'orderDetails.price',
        'orderDetails.discount',
        'product',
        'category',
        'supplier',
      ])
      .getOne();

    if (order?.customerId !== req.user.id && req.user.roles !== ('R3' || 'R1')) {
      return res.status(403).json({ message: 'You do not have permission to access this resource' });
    }

    if (order) {
      res.status(200).json(order);
    } else {
      res.sendStatus(204);
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Internal server error', errors: error });
  }
});

// create order
router.post('/', passport.authenticate(['jwt', 'anonymous'], { session: false }), async (req: any, res: Response) => {
  const {
    firstName,
    lastName,
    phoneNumber,
    email,
    shippedDate,
    status,
    description,
    shippingAddress,
    shippingCity,
    paymentType,
    customerId,
    employeeId,
    orderDetails,
    voucherCode,
    voucherId,
  } = req.body;

  try {
    // 1. Kiểm tra số lượng tồn kho của tất cả sản phẩm trong đơn hàng
    for (const od of orderDetails) {
      const product = await productRepository.findOne({ where: { id: od.productId } });
      if (!product) {
        return res.status(400).json({ message: 'Sản phẩm không tồn tại' });
      }
      if (product.stock < od.quantity) {
        return res.status(400).json({ message: 'Số lượng sản phẩm không đủ' });
      }
    }

    // 2. Tạo đơn hàng mới với trạng thái
    let order: Partial<Order> = {
      shippedDate,
      status,
      description,
      shippingAddress,
      shippingCity,
      paymentType,
      customerId,
      employeeId,
      voucherId,
    };

    if (customerId) {
      let customer: any = await customerRepository.findOne({ where: { id: customerId } });
      if (customer.roleCode === 'R3' || customer.roleCode === 'R1') {
        order.employeeId = customer.id;
      } else {
        order.customerId = customer.id;
      }
    } else {
      let customer = await customerRepository.findOne({ where: { email } });
      if (customer) {
        return res.status(400).json({ message: 'Email đã tồn tại, vui lòng dùng email khác hoặc đăng nhập để mua hàng' });
      } else {
        customer = await customerRepository.save({ phoneNumber, email, firstName, lastName });
        order.customerId = customer.id;
      }
    }
    if (voucherCode) {
      const voucher = await voucherRepository.findOne({ where: { voucherCode } });
      if (!voucher) {
        return res.status(400).json({ message: 'Voucher không hợp lệ' });
      }
      order.voucherId = voucher.id;
    }

    const newOrder = orderRepository.create(order);
    const savedOrder = await orderRepository.save(newOrder);

    // 3. Tạo và lưu các chi tiết đơn hàng
    const orderDetailEntities = orderDetails.map((od: any) => {
      return orderDetailRepository.create({
        ...od,
        order: savedOrder,
      });
    });
    const savedOrderDetails = await orderDetailRepository.save(orderDetailEntities);
    savedOrder.orderDetails = savedOrderDetails;

    // 4. Cập nhật số lượng tồn kho của sản phẩm
    for (const od of savedOrderDetails) {
      const product: any = await productRepository.findOneBy({ id: od.productId });
      product.stock -= od.quantity;
      await productRepository.save(product);
    }

    res.status(201).json(savedOrder);
  } catch (error) {
    console.log('««««« error »»»»»', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi tạo đơn hàng mới.' });
  }
});
// GET /orders/user/:userId
router.get('/user/:userId', passport.authenticate('jwt', { session: false }), async (req: any, res: Response) => {
  const userId = parseInt(req.params.userId, 10);
  if (userId !== req.user.id && req.user.roles !== ('R3' || 'R1')) {
    return res.status(403).json({ message: 'You do not have permission to access this resource' });
  }
  try {
    // Kiểm tra xem userId có tồn tại trong bảng Customer không
    const customer = await customerRepository.findOne({ where: { id: userId } });
    if (!customer) {
      return res.status(404).json({ message: 'Không tìm thấy khách hàng.' });
    }

    // Lấy danh sách đơn hàng của khách hàng
    const orders = await orderRepository.find({
      where: { customer },
      relations: ['orderDetails', 'orderDetails.product'],
    });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy danh sách đơn hàng.' });
  }
});
// update
router.patch('/:orderId', passport.authenticate('jwt', { session: false }), allowRoles('R1', 'R3'), async (req: Request, res: Response) => {
  const orderId = parseInt(req.params.orderId, 10);
  const { shippedDate, status, description, shippingAddress, shippingCity, paymentType, customerId, employeeId, orderDetails } = req.body;

  try {
    // Tìm đơn hàng theo orderId
    const order = await orderRepository.findOneBy({ id: orderId });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Cập nhật các trường của đơn hàng
    order.shippedDate = shippedDate;
    order.status = status;
    order.description = description;
    order.shippingAddress = shippingAddress;
    order.shippingCity = shippingCity;
    order.paymentType = paymentType;
    order.customerId = customerId;
    order.employeeId = employeeId;

    order.orderDetails = [];
    // Nếu không có orderDetails mới được gửi lên, giữ nguyên orderDetails hiện tại
    if (!orderDetails || orderDetails.length === 0) {
      order.orderDetails = [];
      order.orderDetails = await orderDetailRepository.save(order.orderDetails);
    } else {
      // Xóa tất cả chi tiết đơn hàng hiện có
      order.orderDetails = [];
      // Thêm các chi tiết đơn hàng mới
      const newOrderDetails = orderDetails.map((od: any) => {
        const newOrderDetail = orderDetailRepository.create({
          productId: od.productId,
          quantity: od.quantity,
          price: od.price,
          discount: od.discount,
        });
        return newOrderDetail;
      });
      order.orderDetails = await orderDetailRepository.save(newOrderDetails);
    }

    // Lưu đơn hàng đã cập nhật
    const updatedOrder = await orderRepository.save(order);
    res.status(200).json(updatedOrder);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update order' });
  }
});
// PATCH /orders/:orderId/cancel
router.patch('/:orderId/cancel', passport.authenticate('jwt', { session: false }), async (req: any, res: Response) => {
  const orderId = parseInt(req.params.orderId, 10);
  const customerId = req.user.id;

  try {
    // Tìm đơn hàng theo orderId
    const order = await orderRepository.findOne({
      where: { id: orderId, customerId },
      relations: ['orderDetails', 'orderDetails.product'],
    });

    if (!order) {
      return res.status(404).json({ message: 'Đơn hàng không tồn tại.' });
    }

    // Kiểm tra xem đơn hàng đã được giao chưa
    if (order.status === 'COMPLETED' || order.status === 'DELIVERING') {
      return res.status(400).json({ message: 'Không thể hủy đơn hàng đã được hoặc đang giao.' });
    }

    // Cập nhật trạng thái đơn hàng và hoàn tồn kho cho sản phẩm
    order.status = 'CANCELLED';
    for (const orderDetail of order.orderDetails) {
      const product = await productRepository.findOne({ where: { id: orderDetail.productId } });
      if (product) {
        product.stock += orderDetail.quantity;
        await productRepository.save(product);
      }
    }

    await orderRepository.save(order);

    res.status(200).json({ message: 'Đơn hàng đã được hủy thành công.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi hủy đơn hàng.' });
  }
});
// DELETE /orders/:orderId
router.delete('/:orderId', passport.authenticate('jwt', { session: false }), allowRoles('R1', 'R3'), async (req: Request, res: Response) => {
  const orderId = parseInt(req.params.orderId, 10);

  try {
    // Tìm đơn hàng theo orderId
    const order = await orderRepository.findOneBy({ id: orderId });
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
    }

    // Xóa đơn hàng
    await orderRepository.remove(order);

    res.status(200).json({ message: 'Đơn hàng đã được xóa thành công.' });
  } catch (error) {
    res.status(500).json({ message: 'Đã xảy ra lỗi khi xóa đơn hàng.' });
  }
});

export default router;
