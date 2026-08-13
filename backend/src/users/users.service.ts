import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { MailService } from '../mail/mail.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserEntity } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import axios from 'axios';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogs: AuditLogsService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: CreateUserDto, isAdminCreated: boolean = false, adminId?: number): Promise<any> {
    const existingUser = await this.prisma.user.findFirst({ where: { email: dto.email } });
    
    if (existingUser) {
      if (existingUser.isEmailVerified) {
        throw new BadRequestException('Cet email est déjà utilisé.');
      }

      const hashedPassword = await bcrypt.hash(dto.password, 12);
      const verificationToken = isAdminCreated ? null : crypto.randomBytes(32).toString('hex');
      const targetRole = isAdminCreated ? dto.role : 'HEALTH_PRO';

      await this.prisma.user.update({
        where: { id: existingUser.id },
        data: {
          password: hashedPassword,
          role: targetRole,
          isEmailVerified: isAdminCreated,
          verificationToken,
          createdAt: new Date(),
        },
      });

      if (!isAdminCreated && verificationToken) {
        await this.mailService.sendVerificationEmail(dto.email, verificationToken);
      }

      return { message: isAdminCreated ? "Utilisateur créé avec succès." : "Un nouveau lien de validation vous a été envoyé par e-mail." };
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const verificationToken = isAdminCreated ? null : crypto.randomBytes(32).toString('hex');

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        role: dto.role,
        isEmailVerified: isAdminCreated,
        verificationToken,
        profile: dto.role === 'HEALTH_PRO' ? { create: {} } : undefined,
      },
    });

    if (!isAdminCreated && verificationToken) {
      await this.mailService.sendVerificationEmail(user.email, verificationToken);
    }

    if (isAdminCreated && adminId) {
      await this.prisma.auditLog.create({
        data: {
          action: 'CREATE_USER',
          entityType: 'USER',
          entityId: user.id,
          adminId: adminId,
          details: { targetEmail: user.email, targetRole: user.role }
        }
      });
    }

    return { message: isAdminCreated ? "Utilisateur créé avec succès." : "Inscription réussie. Veuillez vérifier vos e-mails." };
  }

  async verifyEmailToken(token: string) {
    const user = await this.prisma.user.findUnique({ where: { verificationToken: token } });
    if (!user) {
      throw new BadRequestException('Lien de validation invalide ou expiré.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        verificationToken: null,
      },
    });

    return { success: true };
  }

  async findOne(id: number): Promise<any> {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: { profile: { include: { cpts: true } } }
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return user;
  }

  async findOneByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email, deletedAt: null }
    });
  }

  async updateProfile(userId: number, dto: UpdateProfileDto, isAdmin: boolean = false) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { profile: true } });
    if (!user || !user.profile) throw new NotFoundException('Profil non trouvé.');
  
    if (!isAdmin && user.profile.isValidated) {
      return this.prisma.profile.update({
        where: { userId },
        data: {
          radius: dto.radius ? +dto.radius : user.profile.radius,
        },
      });
    }

    let lat = user.profile.lat;
    let lng = user.profile.lng;
  
    if (dto.address && dto.address !== user.profile.address) {
      if (dto.lat !== undefined && dto.lng !== undefined) {
        lat = dto.lat ? parseFloat(dto.lat as any) : null;
        lng = dto.lng ? parseFloat(dto.lng as any) : null;
      } else {
        try {
          const coords = await this.geocodeAddress(dto.address);
          lat = coords.lat;
          lng = coords.lng;
        } catch (err) {
          throw new BadRequestException("L'adresse fournie n'a pas pu être géolocalisée.");
        }
      }
    }
  
    return this.prisma.profile.update({
      where: { userId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        gender: dto.gender,
        phone: dto.phone,
        rpps: dto.rpps,
        adeli: dto.adeli,
        specialty: dto.specialty,
        cptsId: dto.cptsId ? +dto.cptsId : null,
        radius: dto.radius ? +dto.radius : 10,
        hasFormationDeces: dto.hasFormationDeces,
        hasTeleconsultation: dto.hasTeleconsultation,
        address: dto.address,
        lat,
        lng,
      },
    });
  }

  async unlockProfile(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { profile: true } });
    if (!user || !user.profile) throw new NotFoundException('Profil non trouvé.');
    return this.prisma.profile.update({
      where: { userId },
      data: { isValidated: false },
    });
  }

  async updateAvailability(userId: number, shifts: any[]) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { profile: true } });
    if (!user || !user.profile) throw new NotFoundException('Profil non trouvé.');

    const profileId = user.profile.id;

    await this.prisma.availability.deleteMany({
      where: { profileId }
    });

    if (shifts && shifts.length > 0) {
      const data = shifts.map(shift => {
        const targetDate = new Date(shift.date + 'T00:00:00.000Z');
        const [sh, sm] = shift.start.split(':');
        const [eh, em] = shift.end.split(':');
        
        const startTime = new Date(targetDate);
        startTime.setUTCHours(+sh, +sm, 0, 0);
        
        const endTime = new Date(targetDate);
        endTime.setUTCHours(+eh, +em, 0, 0);

        return {
          profileId,
          date: targetDate,
          startTime,
          endTime,
        };
      });

      await this.prisma.availability.createMany({ data });
    }
    return { success: true };
  }

  async getMyAvailability(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { profile: true } });
    if (!user || !user.profile) throw new NotFoundException('Profil non trouvé.');

    const avs = await this.prisma.availability.findMany({
      where: { profileId: user.profile.id, date: { gte: new Date(new Date().setUTCHours(0,0,0,0)) } },
      orderBy: { startTime: 'asc' },
    });

    return avs.map(a => ({
      date: a.date.toISOString().split('T')[0],
      start: a.startTime.getUTCHours().toString().padStart(2, '0') + ':' + a.startTime.getUTCMinutes().toString().padStart(2, '0'),
      end: a.endTime.getUTCHours().toString().padStart(2, '0') + ':' + a.endTime.getUTCMinutes().toString().padStart(2, '0')
    }));
  }

  async changePassword(userId: number, dto: any) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    const isMatch = await bcrypt.compare(dto.oldPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Le mot de passe actuel est incorrect.');
    }

    const hashedNewPassword = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    return { success: true, message: 'Votre mot de passe a été modifié avec succès.' };
  }

  async searchPros(adminId: number, address: string, searchTime: string, searchId: string, filters?: any) {
    const coords = await this.geocodeAddress(address);
    await this.auditLogs.trackSearch(adminId, { address, searchDate: searchTime, searchId, filters });
    const pros = await this.findProsInRadius(coords.lat, coords.lng, searchTime);
    return { coords, pros };
  }

  private async geocodeAddress(address: string): Promise<{ lat: number; lng: number }> {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
    try {
      const response = await axios.get(url, { headers: { 'User-Agent': 'QisanaApp/1.0' } });
      if (!response.data || response.data.length === 0) throw new BadRequestException("L'adresse est introuvable.");
      return { lat: parseFloat(response.data[0].lat), lng: parseFloat(response.data[0].lon) };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException("Service géolocalisation indisponible.");
    }
  }

  async findProsInRadius(targetLat: number, targetLng: number, searchTime: string): Promise<any[]> {
    const now = new Date(searchTime);
    const today = new Date(now.toISOString().split('T')[0] + 'T00:00:00.000Z');
    const R = 6371;
    const targetLatRad = targetLat * (Math.PI / 180);
    const targetLngRad = targetLng * (Math.PI / 180);
    
    const pros = await this.prisma.user.findMany({
      where: {
        deletedAt: null,
        role: 'HEALTH_PRO',
        profile: {
          isValidated: true,
          availabilities: { some: { date: today, startTime: { lte: now }, endTime: { gte: now } } },
          NOT: { lat: null }
        }
      },
      include: {
        profile: {
          select: {
            lat: true,
            lng: true,
            address: true,
            specialty: true,
            firstName: true,
            lastName: true,
            gender: true,
            phone: true,
            radius: true,
            hasFormationDeces: true,
            hasTeleconsultation: true
          }
        }
      }
    });

    const prosWithDistance = pros.map(pro => {
      const p = pro.profile;
      if (!p || p.lat === null || p.lng === null) return { ...pro, distance: Infinity };
      
      const proLatRad = p.lat * (Math.PI / 180);
      const proLngRad = p.lng * (Math.PI / 180);
      const dLat = proLatRad - targetLatRad;
      const dLng = proLngRad - targetLngRad;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(targetLatRad) * Math.cos(proLatRad) * Math.sin(dLng / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;
      
      return { ...pro, distance };
    });

    return prosWithDistance
      .filter(pro => pro.distance <= (pro.profile?.radius || 10))
      .sort((a, b) => a.distance - b.distance);
  }

  async updateValidation(userId: number, isValidated: boolean, adminId: number) {
    const updated = await this.prisma.profile.update({ where: { userId }, data: { isValidated } });
    await this.prisma.auditLog.create({
      data: { action: 'VALIDATE', entityType: 'USER', entityId: userId, adminId }
    });
    return updated;
  }

  async findAll() {
    return this.prisma.user.findMany({
      include: { profile: { include: { cpts: true } } }
    });
  }

  async remove(id: number, adminId: number) {
    const user = await this.prisma.user.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.prisma.auditLog.create({
      data: { action: 'SOFT_DELETE', entityType: 'USER', entityId: id, adminId }
    });
    return user;
  }

  async restore(id: number, adminId: number) {
    const user = await this.prisma.user.update({ where: { id }, data: { deletedAt: null } });
    await this.prisma.auditLog.create({
      data: { action: 'RESTORE', entityType: 'USER', entityId: id, adminId }
    });
    return user;
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanExpiredDeletedUsers() {
    const limitDate = new Date();
    limitDate.setMonth(limitDate.getMonth() - 1);
    await this.prisma.user.deleteMany({
      where: {
        role: 'HEALTH_PRO',
        NOT: { deletedAt: null },
        deletedAt: { lte: limitDate }
      }
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async purgeUnverifiedAccounts() {
    const expirationLimit = new Date();
    expirationLimit.setHours(expirationLimit.getHours() - 72);

    const result = await this.prisma.user.deleteMany({
      where: {
        isEmailVerified: false,
        createdAt: { lte: expirationLimit },
        role: 'HEALTH_PRO'
      }
    });

    if (result.count > 0) {
      console.log(`[Cron] Purged ${result.count} unverified accounts.`);
    }
  }
}
