import { Entity, Column, OneToMany, PrimaryGeneratedColumn, BeforeInsert, BeforeUpdate, ManyToOne, JoinColumn, ManyToMany, JoinTable } from 'typeorm';
import { Order } from './order.entity';
import { Role } from './role.entity';
import * as bcrypt from 'bcrypt';
import { Chat } from './chat.entity';
import { IsEmail, IsPhoneNumber } from 'class-validator';
import { Cart } from './cart.entity';
import { Voucher } from './voucher.entity';
import { CustomerVoucher } from './customer-voucher.entity';
const crypto = require('crypto');
@Entity({ name: 'Customers' })
export class Customer {
  // ID
  @PrimaryGeneratedColumn({ name: 'Id' })
  id: number;

  // FIRST NAME
  @Column({ name: 'FirstName', type: 'nvarchar', length: 50 })
  firstName: string;

  // LAST NAME
  @Column({ name: 'LastName', type: 'nvarchar', length: 50, nullable: true })
  lastName: string;

  // PHONE NUMBER
  @Column({ name: 'PhoneNumber', length: 15, nullable: true, type: 'varchar' })
  @IsPhoneNumber('VN')
  phoneNumber: string;

  // ADDRESS
  @Column({ name: 'Address', type: 'nvarchar', nullable: true, length: 500 })
  address: string;

  @Column({ name: 'Photo', type: 'nvarchar', nullable: true, length: 500 })
  photo: string;
  // BIRTHDAY
  @Column({ name: 'Birthday', type: 'date', nullable: true })
  birthday: Date;

  // EMAIL
  @Column({ name: 'Email', unique: true, length: 50, type: 'varchar' })
  @IsEmail()
  email: string;
  // Password (private to prevent accidental exposure)
  @Column({ name: 'Password', length: 255, type: 'varchar', nullable: true }) // Increase length for hashed password
  password: string;

  @Column({ name: 'PasswordChangedAt', type: 'varchar', nullable: true })
  passwordChangedAt: string;

  @Column({ name: 'PasswordResetToken', type: 'varchar', nullable: true })
  passwordResetToken: string;

  @Column({ name: 'PasswordResetExpires', type: 'varchar', nullable: true })
  passwordResetExpires: number;

  @Column({ name: 'RoleCode', type: 'varchar', default: 'R2' })
  roleCode: string;
  @ManyToOne(() => Role, (role) => role.customers)
  role: Role;
  // ORDERS
  @OneToMany(() => Order, (o) => o.customer)
  orders: Order[];

  //CHATS
  @OneToMany(() => Chat, (c) => c.customer)
  chats: Chat[];

  @OneToMany(() => Cart, (c) => c.customer)
  carts: Cart[];

  @OneToMany(() => CustomerVoucher, (v) => v.customer)
  customerVouchers: CustomerVoucher[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }
  // Validate password during login or other authentication scenarios
  async validatePassword(plainPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, this.password);
  }

  createPasswordChangedToken(): string {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = Date.now() + 15 * 60 * 1000;
    return resetToken;
  }
}
