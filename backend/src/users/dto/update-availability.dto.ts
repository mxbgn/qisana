import { IsArray, IsString, ValidateNested, Matches } from 'class-validator';
import { Type } from 'class-transformer';

class ShiftDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be YYYY-MM-DD' })
  date: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'Start must be HH:mm' })
  start: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'End must be HH:mm' })
  end: string;
}

export class UpdateAvailabilityDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShiftDto)
  shifts: ShiftDto[];
}
