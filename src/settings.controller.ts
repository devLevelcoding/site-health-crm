import { Body, Controller, Get, Patch } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async get() {
    const existing = await this.prisma.monitorSettings.findUnique({ where: { id: 1 } });
    if (existing) return existing;
    return this.prisma.monitorSettings.create({ data: { id: 1 } });
  }

  @Patch()
  async update(@Body() body: { intervalDays?: number }) {
    const data: any = {};
    if (body.intervalDays !== undefined) data.intervalDays = Number(body.intervalDays);
    await this.prisma.monitorSettings.upsert({ where: { id: 1 }, create: { id: 1, ...data }, update: data });
    return this.prisma.monitorSettings.findUnique({ where: { id: 1 } });
  }
}
