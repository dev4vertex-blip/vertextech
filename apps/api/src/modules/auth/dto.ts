import {
  IsEmail,
  IsOptional,
  Matches,
  MaxLength,
  IsNotEmpty,
  IsString,
  MinLength,
} from "class-validator";

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  tenantName!: string;
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  tenantSlug!: string;
  @IsEmail()
  email!: string;
  @IsOptional()
  @Matches(/^\+?[1-9]\d{7,14}$/)
  phone?: string;
  @IsString()
  @MinLength(8)
  password!: string;
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  firstName!: string;
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  lastName!: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;
  @IsString()
  @MinLength(8)
  password!: string;
  @IsOptional()
  @IsString()
  tenantSlug?: string;
}

export class RefreshTokenDto {
  @IsString()
  @MinLength(20)
  refreshToken!: string;
}

export class VerifyEmailDto {
  @IsString()
  @MinLength(32)
  token!: string;
}

export class AcceptInvitationDto {
  @IsString()
  @MinLength(32)
  token!: string;
  @IsString()
  @MinLength(8)
  password!: string;
}
