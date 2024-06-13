import { Entity, Column, OneToMany, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Customer } from './customer.entity';
import { Product } from './product.entity';
@Entity({ name: 'Carts' })
export class Cart {
  // ID
  @PrimaryGeneratedColumn()
  Id: number;

  @Column({ type: 'int' })
  customerId: string;

  @Column({ type: 'int' })
  productId: string;

  @Column({ type: 'int' })
  quantity: string;

  @ManyToOne(() => Customer, (customer) => customer.carts)
  customer: Customer;

  @ManyToOne(() => Product, (product) => product.carts)
  product: Product;
}
