import { Entity, Column, OneToMany, PrimaryGeneratedColumn, BeforeInsert, BeforeUpdate, ManyToOne } from 'typeorm';
import { Order } from './order.entity';
import { Role } from './role.entity';
import * as bcrypt from 'bcrypt';
import { Chat } from './chat.entity';
import crypto from 'crypto';
import { IsEmail, IsPhoneNumber, isEmail } from 'class-validator';

@Entity({ name: 'Employees' })
export class Employee {
  // ID
  @PrimaryGeneratedColumn({ name: 'Id' })
  id: number;

  // FIRST NAME
  @Column({ name: 'FirstName', type: 'nvarchar', length: 50 })
  firstName: string;

  // LAST NAME
  @Column({ name: 'LastName', type: 'nvarchar', length: 50 })
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

  @Column({ name: 'RoleCode', type: 'varchar', default: 'R3' })
  roleCode: string;
  @ManyToOne(() => Role, (role) => role.employees)
  role: Role;

  // ORDERS
  @OneToMany(() => Order, (o) => o.employee)
  orders: Order[];

  //CHATS
  @OneToMany(() => Chat, (c) => c.employee)
  chats: Chat[];

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
