import { UserRole } from './user-role.enum';

export interface UserProps {
  id: number | null;
  username: string;
  passwordHash: string;
  age: number;
  role: UserRole;
  createdAt: Date | null;
}

export class User {
  private constructor(private readonly props: UserProps) {}

  static create(props: {
    username: string;
    passwordHash: string;
    age: number;
    role: UserRole;
  }): User {
    return new User({ ...props, id: null, createdAt: null });
  }

  static restore(props: UserProps): User {
    return new User({ ...props });
  }

  get id(): number | null {
    return this.props.id;
  }

  get username(): string {
    return this.props.username;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get age(): number {
    return this.props.age;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get createdAt(): Date | null {
    return this.props.createdAt;
  }
}
