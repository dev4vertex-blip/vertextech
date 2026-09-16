import Joi from "joi";

export function validateEnvironment(
  environment: Record<string, unknown>,
): Record<string, unknown> {
  const schema = Joi.object({
    NODE_ENV: Joi.string()
      .valid("development", "staging", "production")
      .default("development"),
    PORT: Joi.number().port().default(3000),
    CORS_ORIGIN: Joi.string().default("*"),
    LOG_LEVEL: Joi.string()
      .valid("debug", "info", "warn", "error")
      .default("info"),
    DATABASE_URL: Joi.string()
      .uri({ scheme: ["postgresql", "postgres"] })
      .required(),
    JWT_ACCESS_SECRET: Joi.string().min(32).required(),
    JWT_REFRESH_SECRET: Joi.string().min(32).required(),
    JWT_ACCESS_EXPIRES_IN: Joi.string().default("15m"),
    JWT_REFRESH_EXPIRES_IN: Joi.string().default("7d"),
  }).unknown(true);

  const { error, value } = schema.validate(environment, {
    abortEarly: false,
    allowUnknown: true,
  });

  if (error) {
    throw new Error(`Environment validation failed: ${error.message}`);
  }

  return value;
}
