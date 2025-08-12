import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  private users: User[] = [];

  async create(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ): Promise<User> {
    // Check if user already exists
    const existingUser = this.users.find((user) => user.email === email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const user = new User({
      id: this.generateId(),
      email,
      password: hashedPassword,
      firstName,
      lastName,
      isEmailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    this.users.push(user);
    return user;
  }

  findByEmail(email: string): Promise<User | null> {
    return Promise.resolve(
      this.users.find((user) => user.email === email) || null,
    );
  }

  findById(id: string): Promise<User | null> {
    return Promise.resolve(this.users.find((user) => user.id === id) || null);
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }

  updateEmailVerification(userId: string, isVerified: boolean): Promise<User> {
    const user = this.users.find((u) => u.id === userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isEmailVerified = isVerified;
    user.updatedAt = new Date();
    return Promise.resolve(user);
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  // For testing purposes
  getAllUsers(): Promise<User[]> {
    return Promise.resolve(
      this.users.map((user) => ({
        ...user,
        password: undefined, // Don't return passwords
      })),
    );
  }
}
