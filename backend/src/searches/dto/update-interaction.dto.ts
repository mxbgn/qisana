import { IsOptional, IsNumber } from 'class-validator';

export class UpdateInteractionDto {
  @IsOptional()
  @IsNumber()
  selectedProId?: number;

  @IsOptional()
  @IsNumber()
  confirmedProId?: number;
}
