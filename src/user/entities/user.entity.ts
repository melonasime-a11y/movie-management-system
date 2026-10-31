import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
  } from 'typeorm';
  
  export enum UserRole {
    MANAGER = 'manager',
    CUSTOMER = 'customer',
  }
  
  @Entity('users')
  export class User {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column({ unique: true })
    username: string;
  
    @Column()
    password: string;
  
    @Column()
    age: number;
  
    @Column({
      type: 'text',
      default: UserRole.CUSTOMER,
    })
    role: UserRole;
  
    @CreateDateColumn()
    createdAt: Date;
  }