import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { DatabaseController } from './database.controller';

@Module({
  controllers: [DatabaseController],
  providers: [PrismaService, PrismaService],
})
export class DatabaseModule {}
