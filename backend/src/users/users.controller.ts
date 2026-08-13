import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req, Query, Patch, Request, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  register(@Body() createUserDto: CreateUserDto) {
    return this.usersService.register(createUserDto);
  }

  @Get('verify/:token')
  verifyEmail(@Param('token') token: string) {
    return this.usersService.verifyEmailToken(token);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('admin/create')
  createAdmin(@Body() createUserDto: CreateUserDto, @Req() req: any) {
    return this.usersService.register(createUserDto, true, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  updateMyProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.userId, updateProfileDto, false);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile/unlock')
  unlockMyProfile(@Request() req) {
    return this.usersService.unlockProfile(req.user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HEALTH_PRO')
  @Post('availability')
  updateAvailability(@Request() req, @Body() dto: UpdateAvailabilityDto) {
    return this.usersService.updateAvailability(req.user.userId, dto.shifts);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Request() req) {
    return this.usersService.findOne(req.user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HEALTH_PRO')
  @Get('availability/me')
  getMyAvailability(@Request() req) {
    return this.usersService.getMyAvailability(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
    changePassword(@Request() req, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/profile')
  adminUpdateProfile(@Param('id') id: string, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(+id, dto, true);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/validate')
  validatePro(@Param('id') id: string, @Request() req) {
    return this.usersService.updateValidation(+id, true, req.user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.usersService.remove(+id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/restore')
  restore(@Param('id') id: string, @Request() req) {
    return this.usersService.restore(+id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('COORDINATOR', 'ADMIN')
  @Get('search-by-location')
  search(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('date') date: string,
  ) {
    const searchDate = date || new Date().toISOString().split('T')[0];
    return this.usersService.findProsInRadius(+lat, +lng, searchDate);
  }
}
