import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, UpdateDateColumn } from 'typeorm';
import { Customer } from './customer.entity';
import { Employee } from './employee.entity';

@Entity({ name: 'Chats' })
export class Chat {
  @PrimaryGeneratedColumn({ name: 'Id' })
  id: number;

  @Column({ name: 'CustomerName', type: 'nvarchar' })
  customerName: string;

  @Column({ name: 'PhoneNumber', type: 'nvarchar' })
  phoneNumber: string;

  @Column({ type: 'int', nullable: true })
  customerId: number;

  @Column({ type: 'int', nullable: true })
  employeeId: number;

  @Column({ name: 'IsFinished', type: 'boolean', default: false })
  isFinished: boolean;

  @UpdateDateColumn({ name: 'LastUpdated', type: 'datetime' })
  lastUpdated: Date;

  @ManyToOne(() => Customer, (customer) => customer.chats)
  customer: Customer;

  @ManyToOne(() => Employee, (employee) => employee.chats)
  employee: Employee;
}
