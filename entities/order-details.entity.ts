import { IsNotEmpty, Max, Min } from 'class-validator';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Order } from './order.entity';
import { Product } from './product.entity';

@Entity({ name: 'OrderDetails' })
export class OrderDetail {
  @PrimaryGeneratedColumn({ name: 'Id', type: 'int' })
  id: number;

  @Column({ type: 'int' })
  productId: number;

  @Column({ name: 'Quantity', type: 'int', default: 0 })
  @Min(0)
  quantity: number;

  @Column({ name: 'Price', type: 'int', default: 0 })
  @Min(0)
  price: number;

  @Column({ name: 'Discount', type: 'int', default: 0 })
  @Min(0)
  @Max(90)
  discount: number;

  @ManyToOne(() => Product, (p) => p.orderDetails)
  @JoinColumn({ name: 'productId' })
  product: Product;

  @ManyToOne(() => Order, (o) => o.orderDetails)
  @JoinColumn({ name: 'orderId' })
  order: Order;
}
