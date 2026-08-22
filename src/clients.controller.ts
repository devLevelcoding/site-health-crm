import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { scanWebsite } from './scanning/lighthouse.util';

const NEEDS_REDESIGN_THRESHOLD = 150; // out of 300 (secScore+seoScore+semScore)

async function runScanAndReschedule(prisma: PrismaService, clientId: number, website: string) {
  const result = await scanWebsite(website);
  await prisma.lighthouseScan.create({ data: { clientId, url: result.url, ...result } });

  let settings = await prisma.monitorSettings.findUnique({ where: { id: 1 } });
  if (!settings) settings = await prisma.monitorSettings.create({ data: { id: 1 } });

  const dueAt = new Date(Date.now() + settings.intervalDays * 24 * 60 * 60 * 1000);
  await prisma.scanReminder.create({ data: { clientId, dueAt } });

  return result;
}

@Controller('clients')
export class ClientsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async findAll(@Query('page') page = '1', @Query('limit') limit = '20') {
    const take = +limit;
    const skip = (+page - 1) * take;
    const where = { deletedAt: null };
    const [clients, total] = await Promise.all([
      this.prisma.client.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.client.count({ where }),
    ]);

    const data = await Promise.all(
      clients.map(async (c) => {
        const latest = await this.prisma.lighthouseScan.findFirst({ where: { clientId: c.id }, orderBy: { scannedAt: 'desc' } });
        const total = latest ? latest.secScore + latest.seoScore + latest.semScore : null;
        return { ...c, latestScore: total, needsRedesign: total !== null && total < NEEDS_REDESIGN_THRESHOLD };
      }),
    );

    return { data, total, page: +page, limit: take };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const client = await this.prisma.client.findUnique({ where: { id: +id } });
    if (!client) throw new BadRequestException('Client not found');
    const scans = await this.prisma.lighthouseScan.findMany({ where: { clientId: +id }, orderBy: { scannedAt: 'desc' } });
    return { ...client, scans };
  }

  // Registering a client immediately runs the first scan and schedules the
  // next one — "baked in from day one," same pattern as Patient CRM's known-
  // overdue-date-carried-over case, just unconditional here since every new
  // client needs its first scan regardless.
  @Post()
  async create(@Body() body: any) {
    const { name, website, phone, email } = body;
    if (!name || !website) throw new BadRequestException('name and website are required');
    const client = await this.prisma.client.create({ data: { name, website, phone, email } });
    await runScanAndReschedule(this.prisma, client.id, website);
    return client;
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    const data: any = {};
    for (const key of ['name', 'website', 'phone', 'email']) {
      if (body[key] !== undefined) data[key] = body[key];
    }
    return this.prisma.client.update({ where: { id: +id }, data });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.prisma.client.update({ where: { id: +id }, data: { deletedAt: new Date() } });
  }

  // Manual re-scan now — shares the exact same scan+reschedule logic
  // process-due uses, so a manual scan and a due-fired one behave identically.
  @Post(':id/scan')
  async scan(@Param('id') id: string) {
    const client = await this.prisma.client.findUnique({ where: { id: +id } });
    if (!client) throw new BadRequestException('Client not found');
    return runScanAndReschedule(this.prisma, client.id, client.website);
  }
}

export { runScanAndReschedule };
