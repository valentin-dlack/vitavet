export class User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
