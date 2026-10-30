import { IsString, IsOptional, IsInt, Min, Max, IsEnum, IsBoolean, IsNumber } from 'class-validator';
import { Gender, Specialty } from '@prisma/client';

export class UpdateProfileDto {
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  adeli?: string;

  @IsString()
  @IsOptional()
  rpps?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  cptsId?: number;

  @IsEnum(Specialty)
  @IsOptional()
  specialty?: Specialty;

  @IsBoolean()
  @IsOptional()
  hasFormationDeces?: boolean;

  @IsBoolean()
  @IsOptional()
  hasTeleconsultation?: boolean;

  @IsBoolean()
  @IsOptional()
  hasPrado?: boolean;

  @IsBoolean()
  @IsOptional()
  hasPdsa?: boolean;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  lng?: number;

  @IsInt()
  @Min(1)
  @Max(200)
  @IsOptional()
  radius?: number;
}
