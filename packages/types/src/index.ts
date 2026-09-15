// Common types for VERTEX platform

export type ID = string;

export interface BaseEntity {
  id: ID;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole =
  | "owner"
  | "admin"
  | "manager"
  | "staff"
  | "accountant"
  | "support";