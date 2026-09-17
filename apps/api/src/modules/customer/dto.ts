import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
} from "class-validator";

export class UpdateBusinessDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name?: string;
  @IsOptional()
  @IsEmail()
  businessEmail?: string;
  @IsOptional()
  @Matches(/^\+?[1-9]\d{7,14}$/)
  businessPhone?: string;
  @IsOptional()
  @IsUrl({ require_tld: false })
  website?: string;
  @IsOptional()
  @IsString()
  @MaxLength(120)
  industry?: string;
  @IsOptional()
  @IsString()
  @MaxLength(240)
  address?: string;
  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;
  @IsOptional()
  @IsString()
  @MaxLength(80)
  state?: string;
  @IsOptional()
  @IsString()
  @MaxLength(80)
  country?: string;
  @IsOptional()
  @Matches(/^[A-Za-z0-9 -]{3,20}$/)
  postalCode?: string;
  @IsOptional()
  @IsString()
  @MaxLength(80)
  timezone?: string;
  @IsOptional()
  @Matches(/^[A-Z]{3}$/)
  currency?: string;
  @IsOptional()
  @IsString()
  @MaxLength(500)
  logoReference?: string;
  @IsOptional()
  @IsString()
  @MaxLength(120)
  slug?: string;
}

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  timezone?: string;
  @IsOptional()
  @Matches(/^[A-Z]{3}$/)
  currency?: string;
  @IsOptional()
  @IsString()
  @MaxLength(40)
  dateFormat?: string;
  @IsOptional()
  @IsString()
  @MaxLength(20)
  language?: string;
  @IsOptional()
  notificationPreferences?: Record<string, boolean>;
  @IsOptional()
  businessSettings?: Record<string, string | number | boolean>;
}
