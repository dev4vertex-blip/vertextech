import {
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from "class-validator";

export class RegisterDto {
  @IsString()
  tenantName!: string;
  @IsString()
  tenantSlug!: string;
  @IsEmail()
  email!: string;
  @IsString()
  @MinLength(8)
  password!: string;
  @IsString()
  firstName!: string;
  @IsString()
  lastName!: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;
  @IsString()
  @MinLength(8)
  password!: string;
  @IsOptional()
  @IsUUID()
  tenantId?: string;
}

export class RefreshTokenDto {
  @IsString()
  @MinLength(20)
  refreshToken!: string;
}
