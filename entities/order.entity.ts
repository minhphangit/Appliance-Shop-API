import { IsIn, MaxLength, ValidateIf } from 'class-validator';
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { OrderDetail } from './order-details.entity';
import { Customer } from './customer.entity';
import { Employee } from './employee.entity';
import { Voucher } from './voucher.entity';

@Entity({ name: 'Orders' })
export class Order {
  @PrimaryGeneratedColumn({ name: 'Id' })
  id: number;

  @Column({ name: 'CreatedDate', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdDate: Date;

  @Column({ name: 'ShippedDate', type: 'datetime', nullable: true })
  shippedDate: Date;

  // ----------------------------------------------------------------------------------------------
  // STATUS
  // ----------------------------------------------------------------------------------------------
  @Column({ name: 'Status', type: 'varchar', default: 'WAITING', length: 50 })
  @IsIn(['WAITING', 'COMPLETED', 'CANCELLED', 'DELIVERING'])
  status: string;

  // ----------------------------------------------------------------------------------------------
  // DESCRIPTION
  // ----------------------------------------------------------------------------------------------
  // @Column({ name: 'Description', type: 'nvarchar', length: 'MAX', nullable: true })
  @Column({ name: 'Description', type: 'nvarchar', nullable: true })
  description: string;

  // ----------------------------------------------------------------------------------------------
  // SHIPPING ADDRESS
  // ----------------------------------------------------------------------------------------------
  @Column({ name: 'ShippingAddress', type: 'nvarchar', nullable: true, length: 500 })
  shippingAddress: string;

  // ----------------------------------------------------------------------------------------------
  // SHIPPING CITY
  // ----------------------------------------------------------------------------------------------
  @Column({ name: 'ShippingCity', type: 'nvarchar', nullable: true, length: 50 })
  shippingCity: string;

  // ----------------------------------------------------------------------------------------------
  // PAYMENT TYPE
  // ----------------------------------------------------------------------------------------------
  @Column({ name: 'PaymentType', type: 'varchar', length: 20, default: 'CASH' })
  @IsIn(['CASH', 'MOMO'])
  paymentType: string;

  @Column({ type: 'int' })
  customerId: number;

  @Column({ type: 'int', nullable: true })
  employeeId: number;
  @Column({ type: 'int', nullable: true })
  voucherId: number;

  // RELATIONS
  @ManyToOne(() => Customer, (c) => c.orders)
  customer: Customer;

  @ManyToOne(() => Employee, (e) => e.orders)
  employee: Employee;

  @OneToMany(() => OrderDetail, (od) => od.order)
  orderDetails: OrderDetail[];

  @ManyToOne(() => Voucher, (voucher) => voucher.orders, { nullable: true })
  voucher: Voucher;
}
