import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CptsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.cPTS.findMany({
      orderBy: [
        { region: 'asc' },
        { department: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  async findGrouped() {
    const cpts = await this.findAll();
  
    const grouped: Record<string, Record<string, any[]>> = {};
  
    for (const item of cpts) {
      const region = item.region || 'Other';
      const department = item.department || 'Other';
  
      if (!grouped[region]) {
        grouped[region] = {};
      }
  
      if (!grouped[region][department]) {
        grouped[region][department] = [];
      }
  
      grouped[region][department].push(item);
    }
  
    return grouped;
  }
}
