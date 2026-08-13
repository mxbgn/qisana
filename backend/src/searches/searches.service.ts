import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchesService {
  constructor(private prisma: PrismaService) {}

  async getUserSnapshots(userId: number) {
    return this.prisma.searchSnapshot.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async saveSnapshot(userId: number, data: any) {
    const count = await this.prisma.searchSnapshot.count({ where: { userId } });
    if (count >= 6) {
      const oldest = await this.prisma.searchSnapshot.findFirst({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      });
      if (oldest) {
        await this.prisma.searchSnapshot.delete({ where: { searchId: oldest.searchId } });
      }
    }

    return this.prisma.searchSnapshot.create({
      data: {
        searchId: data.searchId,
        userId,
        title: data.address.split(',')[0] || 'Recherche',
        address: data.address,
        searchDate: data.searchDate,
        coords: data.coords,
        filters: data.filters,
        results: data.results,
        selectedProId: data.selectedProId || null,
        confirmedProId: data.confirmedProId || null,
      },
    });
  }

  async updateSnapshotInteraction(userId: number, searchId: string, data: { selectedProId?: number | null; confirmedProId?: number | null }) {
    return this.prisma.searchSnapshot.updateMany({
      where: { searchId, userId },
      data,
    });
  }

  async deleteSnapshot(userId: number, searchId: string) {
    return this.prisma.searchSnapshot.deleteMany({
      where: { searchId, userId },
    });
  }
}
