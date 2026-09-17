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

export class InviteTeamMemberDto {
  @IsEmail()
  email!: string;
  @IsString()
  @MaxLength(80)
  firstName!: string;
  @IsString()
  @MaxLength(80)
  lastName!: string;
  @IsString()
  @Matches(/^(ADMIN|MANAGER|STAFF)$/)
  role!: "ADMIN" | "MANAGER" | "STAFF";
}

export class UpdateTeamMemberDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  firstName?: string;
  @IsOptional()
  @IsString()
  @MaxLength(80)
  lastName?: string;
  @IsOptional()
  @Matches(/^(ADMIN|MANAGER|STAFF)$/)
  role?: "ADMIN" | "MANAGER" | "STAFF";
}

export class UpdateTeamMemberStatusDto {
  @Matches(/^(ACTIVE|SUSPENDED)$/)
  status!: "ACTIVE" | "SUSPENDED";
}

export class TeamListQueryDto {
  @IsOptional()
  @Matches(/^(ACTIVE|INVITED|SUSPENDED|ARCHIVED)$/)
  status?: "ACTIVE" | "INVITED" | "SUSPENDED" | "ARCHIVED";
  @IsOptional()
  @Matches(/^(OWNER|ADMIN|MANAGER|STAFF)$/)
  role?: "OWNER" | "ADMIN" | "MANAGER" | "STAFF";
  @IsOptional()
  @IsString()
  @MaxLength(80)
  search?: string;
  @IsOptional()
  @Matches(/^[1-9]\d*$/)
  page?: string;
  @IsOptional()
  @Matches(/^[1-9]\d*$/)
  pageSize?: string;
}
