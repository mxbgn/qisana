import { Exclude } from 'class-transformer';
import { Role } from '@prisma/client';

export class UserEntity {
  id: number;
  email: string;
  role: Role;
  createdAt: Date;
  deletedAt: Date | null;
  profile?: any;

  @Exclude()
  password: string;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}
