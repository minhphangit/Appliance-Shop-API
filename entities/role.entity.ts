import { IsNotEmpty, Length, MaxLength, ValidateIf, validate, validateOrReject } from 'class-validator';
import { BaseEntity, BeforeInsert, BeforeUpdate, Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Customer } from './customer.entity';
import { Employee } from './employee.entity';

@Entity({ name: 'Roles' })
export class Role extends BaseEntity {
  @PrimaryGeneratedColumn({ name: 'Id' })
  id: number;

  @Column({ name: 'RoleCode', unique: true, type: 'varchar', length: 10, nullable: false })
  roleCode: string;

  @Column({ name: 'Value', unique: true, type: 'varchar', length: 50, nullable: false })
  value: string;
  @OneToMany(() => Customer, (c) => c.role)
  customers: Customer[];
  @OneToMany(() => Employee, (c) => c.role)
  employees: Employee[];
}
