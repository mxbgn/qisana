import { Controller, Get, Post, Body, UseGuards, Request, Param, Res, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { AuditLogsService } from './audit-logs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @Roles('ADMIN')
  findAll() {
    return this.auditLogsService.findAll();
  }

  @Post('track-search')
  @Roles('COORDINATOR', 'ADMIN')
  trackSearch(@Request() req, @Body() body: { address: string; searchDate: string; searchId: string }) {
    return this.auditLogsService.trackSearch(req.user.userId, body);
  }

  @Post('track-click')
  @Roles('COORDINATOR', 'ADMIN')
  trackClick(@Request() req, @Body() body: { proId: number; searchId: string; address: string }) {
    return this.auditLogsService.trackProClick(req.user.userId, body);
  }

  @Get('reports')
  @Roles('ADMIN')
  listReports() {
    return this.auditLogsService.getGeneratedReports();
  }

  @Get('reports/download/:fileName')
  @Roles('ADMIN')
  downloadReport(@Param('fileName') fileName: string, @Res() res: Response) {
    const safeName = path.basename(fileName);
    const filePath = path.join(process.cwd(), 'reports', safeName);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Fichier introuvable.');
    }

    res.download(filePath, safeName);
  }
}
