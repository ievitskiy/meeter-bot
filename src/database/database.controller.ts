import { Controller, Get } from '@nestjs/common';
import { User } from '@prisma/client';
import { DatabaseService } from './database.service';

@Controller('database')
export class DatabaseController {
  constructor(private readonly databaseService: DatabaseService) {}

  //api for external apps **IN PROGRESS**

  @Get('/')
  async getUsers(): Promise<User[]> {
    return this.databaseService.getUsers();
  }
}
