import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { User as GrammyUser } from 'grammy/types';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class DatabaseService {
  constructor(private prisma: PrismaService) {}

  async getUserByTgId(telegram_id: number): Promise<User> {
    return this.prisma.user.findUnique({
      where: {
        tg_id: telegram_id.toString(),
      },
    });
  }

  async registerUser(tg_user: GrammyUser): Promise<User> {
    return this.prisma.user.create({
      data: {
        tg_id: tg_user.id.toString(),
        tg_first_name: tg_user.first_name,
        tg_is_bot: tg_user.is_bot,
        tg_last_name: tg_user.last_name,
        tg_username: tg_user.username,
      },
    });
  }

  async getUsers(): Promise<User[]> {
    return this.prisma.user.findMany();
  }
}
