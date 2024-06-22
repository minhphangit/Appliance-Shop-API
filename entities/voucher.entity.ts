import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn, ManyToMany } from 'typeorm';
import { Order } from './order.entity';
import { Min, Max } from 'class-validator';
import { CustomerVoucher } from './customer-voucher.entity';
@Entity({ name: 'Vouchers' })
export class Voucher {
  @PrimaryGeneratedColumn({ name: 'Id' })
  id: number;

  @Column({ name: 'VoucherCode', type: 'varchar', length: 50 })
  voucherCode: string;

  @Column({ name: 'DiscountPercentage', type: 'int' })
  @Min(1)
  @Max(100)
  discountPercentage: number;

  @Column({ name: 'StartDate', type: 'date' })
  startDate: Date;

  @Column({ name: 'ExpiryDate', type: 'date' })
  expiryDate: Date;

  @Column({ name: 'maxUsageCount', type: 'int' })
  @Min(1)
  maxUsageCount: number;

  @Column({ name: 'RemainingUsageCount', type: 'int' })
  @Min(0)
  remainingUsageCount: number;

  @Column({ name: 'VoucherType', type: 'varchar', length: 50 })
  voucherType: string;

  @OneToMany(() => Order, (order) => order.voucher)
  orders: Order[];

  @OneToMany(() => CustomerVoucher, (v) => v.voucher)
  customerVouchers: CustomerVoucher[];
}
