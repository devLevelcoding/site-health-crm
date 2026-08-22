import { Controller, Get, Post, Query } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { runScanAndReschedule } from './clients.controller';

// The recurring monitor's own "runs itself" firing point — same honest
// scoping as every other CRM's process-due (no cron infrastructure anywhere
// in this catalog). Unlike Patient/Intake CRM's reminder, firing here
// actually performs the monitored action (re-scanning the site) and
// reschedules the next one in the same step — see schema.prisma's
// ScanReminder comment for why that's safe here specifically.
@Controller('scan-reminders')
export class ScanRemindersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async findAll(@Query('status') status?: string) {
    const where: any = {};
    if (status) where.status = status;
    const data = await this.prisma.scanReminder.findMany({ where, orderBy: { dueAt: 'asc' }, include: { client: true } });
    return { data, total: data.length };
  }

  @Post('process-due')
  async processDue() {
    const due = await this.prisma.scanReminder.findMany({
      where: { status: 'pending', dueAt: { lte: new Date() } },
      include: { client: true },
    });

    const fired = [];
    for (const reminder of due) {
      await runScanAndReschedule(this.prisma, reminder.clientId, reminder.client.website);
      const updated = await this.prisma.scanReminder.update({ where: { id: reminder.id }, data: { status: 'done' } });
      fired.push(updated);
    }
    return { fired: fired.length, data: fired };
  }
}
