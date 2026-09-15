// VERTEX Configuration

export const APP_NAME = "VERTEX";
export const APP_VERSION = "0.1.0";

export const DEFAULT_PAGE_SIZE = 20;

export const SUPPORTED_ENVIRONMENTS = ["development", "staging", "production"] as const;

export type Environment = (typeof SUPPORTED_ENVIRONMENTS)[number];