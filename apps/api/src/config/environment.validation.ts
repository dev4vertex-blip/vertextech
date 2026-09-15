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
