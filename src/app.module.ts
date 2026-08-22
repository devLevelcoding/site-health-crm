import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ClientsController } from './clients.controller';
import { ScanRemindersController } from './scan-reminders.controller';
import { SettingsController } from './settings.controller';

@Module({
  controllers: [ClientsController, ScanRemindersController, SettingsController],
  providers: [PrismaService],
})
export class AppModule {}
