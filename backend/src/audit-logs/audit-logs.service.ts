import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const logs = await this.prisma.auditLog.findMany({
      include: { admin: { select: { email: true } } },
      orderBy: { createdAt: 'desc' }
    });

    const directActionLogs = logs.filter(l => l.action === 'PRO_CLICKED');

    return Promise.all(logs.map(async (log) => {
      const logDetails = log.details as any || {};

      if (log.action === 'MAP_SEARCH') {
        const searchId = logDetails?.searchId;
        const relativeClicks = directActionLogs.filter(c => (c.details as any)?.searchId === searchId);

        let durationMs: number | null = null;
        if (relativeClicks.length > 0) {
          const sortedClicks = [...relativeClicks].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          const lastInteractionTime = sortedClicks[0].createdAt.getTime();
          const searchTime = log.createdAt.getTime();
          durationMs = Math.max(0, lastInteractionTime - searchTime);
        }

        const uniqueClicksMap = new Map<number, any>();
        relativeClicks.forEach(clickLog => {
          uniqueClicksMap.set(clickLog.entityId, clickLog);
        });

        const uniqueClicks = Array.from(uniqueClicksMap.values());

        const interactions = await Promise.all(uniqueClicks.map(async (clickLog) => {
          const pro = await this.prisma.user.findUnique({
            where: { id: clickLog.entityId },
            include: { profile: { include: { cpts: true } } }
          });
          const clickDetails = clickLog.details as any;
          return {
            id: pro?.id,
            email: pro?.email,
            firstName: pro?.profile?.firstName,
            lastName: pro?.profile?.lastName,
            gender: pro?.profile?.gender,
            specialty: pro?.profile?.specialty,
            address: pro?.profile?.address,
            status: clickDetails?.status || 'NONE'
          };
        }));

        return {
          id: log.id,
          action: log.action,
          entityType: log.entityType,
          entityId: log.entityId,
          adminId: log.adminId,
          createdAt: log.createdAt,
          adminEmail: log.admin?.email || 'Système',
          targetEmail: logDetails?.address || 'Recherche Générale',
          clickCount: uniqueClicks.length,
          durationMs,
          details: {
            address: logDetails?.address || 'Recherche Générale',
            searchDate: logDetails?.searchDate || '',
            searchId: logDetails?.searchId || '',
            filters: logDetails?.filters || null,
            interactions
          }
        };
      }

      let targetEmail = logDetails?.targetEmail || 'N/A';
      let targetRole = logDetails?.targetRole || null;
      let targetName = logDetails?.targetName || null;

      if (log.entityId && log.entityId !== 0) {
        const target = await this.prisma.user.findUnique({
          where: { id: log.entityId },
          include: { profile: true }
        });
        
        if (target) {
          targetEmail = target.email;
          targetRole = target.role;
          if (target.profile) {
            const civility = target.profile.gender === 'MALE' ? 'Mr' : target.profile.gender === 'FEMALE' ? 'Mme' : '';
            const fullName = `${target.profile.firstName || ''} ${target.profile.lastName || ''}`.trim();
            targetName = fullName ? `${civility} ${fullName}`.trim() : null;
          }
        } else {
          targetEmail = 'Utilisateur introuvable';
        }
      }

      return {
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        adminId: log.adminId,
        createdAt: log.createdAt,
        adminEmail: log.admin?.email || 'Système',
        targetEmail,
        targetRole,
        targetName,
        details: logDetails
      };
    }));
  }

  async createLog(adminId: number, action: string, entityId: number, details: any = {}) {
    return this.prisma.auditLog.create({
      data: {
        action,
        entityType: 'USER',
        entityId,
        adminId,
        details
      }
    });
  }

  async trackSearch(adminId: number, data: { address: string; searchDate: string; searchId: string; filters?: any; }) {
    return this.prisma.auditLog.create({
      data: {
        action: 'MAP_SEARCH',
        entityType: 'SYSTEM',
        entityId: 0,
        adminId: adminId,
        details: {
          address: data.address,
          searchDate: data.searchDate,
          searchId: data.searchId,
          filters: data.filters
        }
      }
    });
  }

  async trackProClick(adminId: number, data: { proId: number; searchId: string; address: string; status?: string }) {
    const contextLog = await this.prisma.auditLog.findFirst({
      where: {
        action: 'PRO_CLICKED',
        entityId: data.proId,
        adminId: adminId,
        details: {
          path: ['searchId'],
          equals: data.searchId
        }
      }
    });

    if (contextLog) {
      const existingDetails = contextLog.details as any;
      
      let nextStatus = existingDetails?.status || 'NONE';
      if (data.status && data.status !== 'NONE') {
        nextStatus = data.status;
      }

      return this.prisma.auditLog.update({
        where: { id: contextLog.id },
        data: {
          createdAt: new Date(),
          details: {
            ...existingDetails,
            status: nextStatus
          }
        }
      });
    }

    return this.prisma.auditLog.create({
      data: {
        action: 'PRO_CLICKED',
        entityType: 'USER',
        entityId: data.proId,
        adminId: adminId,
        details: {
          searchId: data.searchId,
          address: data.address,
          status: data.status || 'NONE'
        }
      }
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanExpiredLogs() {
    const limitDate = new Date();
    limitDate.setMonth(limitDate.getMonth() - 2);

    const result = await this.prisma.auditLog.deleteMany({
      where: { createdAt: { lte: limitDate } }
    });

    if (result.count > 0) {
      console.log(`[Cron] Purged ${result.count} audit logs older than 2 months.`);
    }
  }

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async generateMonthlyExcelReport() {
    const now = new Date();
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const logs = await this.prisma.auditLog.findMany({
      where: {
        action: 'MAP_SEARCH',
        createdAt: { gte: firstDayLastMonth, lte: lastDayLastMonth },
      },
      orderBy: { createdAt: 'asc' },
    });

    const directActionLogs = await this.prisma.auditLog.findMany({
      where: {
        action: 'PRO_CLICKED',
        createdAt: { gte: firstDayLastMonth, lte: lastDayLastMonth },
      },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Activité de Recherche');

    worksheet.columns = [
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Localisation', key: 'location', width: 40 },
      { header: 'Temps Passé', key: 'duration', width: 20 },
      { header: 'Pros Consultés', key: 'proCount', width: 20 },
      { header: 'Filtres Appliqués', key: 'filters', width: 40 },
      { header: 'Professionnel Validé', key: 'validatedPro', width: 40 },
      { header: 'CPTS', key: 'cpts', width: 40 },
    ];

    for (const log of logs) {
      const logDetails = log.details as any || {};
      const searchId = logDetails?.searchId;
      const relativeClicks = directActionLogs.filter(c => (c.details as any)?.searchId === searchId);

      let durationStr = '—';
      if (relativeClicks.length > 0) {
        const sortedClicks = [...relativeClicks].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        const durationMs = Math.max(0, sortedClicks[0].createdAt.getTime() - log.createdAt.getTime());
        const totalSeconds = Math.floor(durationMs / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        durationStr = minutes === 0 ? `${seconds}s` : `${minutes}m ${seconds}s`;
      }

      const uniqueProIds = [...new Set(relativeClicks.map(c => c.entityId))];

const activeFilters: string[] = [];
      if (logDetails.filters?.specialty === 'DOCTOR') activeFilters.push('Médecin');
      if (logDetails.filters?.hasFormationDeces) activeFilters.push('Certificat de Décès');
      if (logDetails.filters?.hasTeleconsultation) activeFilters.push('Téléconsultation');
      if (logDetails.filters?.hasPrado) activeFilters.push('PRADO');
      if (logDetails.filters?.hasPdsa) activeFilters.push('PDSA');

      const confirmedClick = relativeClicks.find(c => (c.details as any)?.status === 'CONFIRMED');
      let validatedProName = '—';
      let cptsName = '—';

      if (confirmedClick) {
        const pro = await this.prisma.user.findUnique({
          where: { id: confirmedClick.entityId },
          include: { profile: { include: { cpts: true } } },
        });
        if (pro?.profile) {
          validatedProName = `${pro.profile.firstName || ''} ${pro.profile.lastName || ''}`.trim() || pro.email;
          cptsName = pro.profile.cpts?.name || 'Aucune';
        }
      }

      worksheet.addRow({
        date: log.createdAt.toLocaleDateString('fr-FR'),
        location: logDetails.address || '—',
        duration: durationStr,
        proCount: uniqueProIds.length,
        filters: activeFilters.join(', ') || 'Aucun',
        validatedPro: validatedProName,
        cpts: cptsName,
      });
    }

    worksheet.getRow(1).font = { bold: true };
    
    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir);
    
    const fileName = `Recherches_${firstDayLastMonth.getFullYear()}_${String(firstDayLastMonth.getMonth() + 1).padStart(2, '0')}.xlsx`;
    await workbook.xlsx.writeFile(path.join(reportsDir, fileName));
    
    console.log(`[Cron] Generated monthly report: ${fileName}`);
  }

  getGeneratedReports() {
    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) return [];
    
    return fs.readdirSync(reportsDir).filter(file => file.endsWith('.xlsx')).map(file => {
      const stats = fs.statSync(path.join(reportsDir, file));
      return {
        fileName: file,
        createdAt: stats.birthtime,
        size: `${(stats.size / 1024).toFixed(2)} KB`
      };
    }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}
