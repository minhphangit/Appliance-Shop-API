import { Entity, PrimaryColumn, ManyToOne, JoinColumn, Column } from 'typeorm';
import { Customer } from './customer.entity';
import { Voucher } from './voucher.entity';

@Entity({ name: 'CustomerVouchers' })
export class CustomerVoucher {
  @PrimaryColumn()
  customerId: number;

  @PrimaryColumn()
  voucherId: number;

  @Column({ name: 'VoucherCode', type: 'varchar', length: 50 })
  voucherCode: string;

  @ManyToOne(() => Customer, (customer) => customer.customerVouchers)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @ManyToOne(() => Voucher, (voucher) => voucher.customerVouchers)
  @JoinColumn({ name: 'voucherId' })
  voucher: Voucher;
}
