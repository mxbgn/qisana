import { IsString, IsNotEmpty, IsObject, IsOptional, IsArray } from 'class-validator';

export class SaveSnapshotDto {
  @IsString()
  @IsNotEmpty()
  searchId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  searchDate: string;

  @IsObject()
  coords: { lat: number; lng: number };

  @IsObject()
  filters: Record<string, any>;

  @IsArray()
  results: any[];

  @IsOptional()
  selectedProId?: number | null;

  @IsOptional()
  confirmedProId?: number | null;
}
