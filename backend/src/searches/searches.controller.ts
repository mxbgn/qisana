import { Controller, Get, Post, Delete, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { SearchesService } from './searches.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SaveSnapshotDto } from './dto/save-snapshot.dto';
import { UpdateInteractionDto } from './dto/update-interaction.dto';

@Controller('searches')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('COORDINATOR', 'ADMIN')
export class SearchesController {
  constructor(private readonly searchesService: SearchesService) {}

  @Get()
  async getSnapshots(@Request() req: any) {
    return this.searchesService.getUserSnapshots(req.user.userId);
  }

  @Post()
  async saveSnapshot(@Request() req: any, @Body() dto: SaveSnapshotDto) {
    return this.searchesService.saveSnapshot(req.user.userId, dto);
  }
  
  @Patch(':id')
  async updateInteraction(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateInteractionDto,
  ) {
    return this.searchesService.updateSnapshotInteraction(req.user.userId, id, dto);
  }

  @Delete(':id')
  async deleteSnapshot(@Request() req: any, @Param('id') id: string) {
    return this.searchesService.deleteSnapshot(req.user.userId, id);
  }
}
