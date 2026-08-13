import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Le mot de passe actuel est requis.' })
  oldPassword!: string;

  @IsString()
  @IsNotEmpty({ message: 'Le nouveau mot de passe est requis.' })
  @MinLength(8, { message: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' })
  newPassword!: string;
}
