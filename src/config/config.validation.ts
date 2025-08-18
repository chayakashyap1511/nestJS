// config.validation.ts
import * as Joi from "joi";

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "production")
    .default("development"),
  PORT: Joi.number().default(3000),
  API_PREFIX: Joi.string().default("api"),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default("1d"),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default("7d"),
  SENDGRID_API_KEY: Joi.string().required(),
  BULKSMS_AUTH_HEADER: Joi.string().required(),
  SMS_API_URL: Joi.string().required(),
  APP_BASE_URL: Joi.string().required(),
  EMAIL_SERVICE_ENABLED: Joi.boolean().default(false),
  SMS_SERVICE_ENABLED: Joi.boolean().default(false),

  GOOGLE_CLIENT_ID: Joi.string().required(),
  GOOGLE_CLIENT_SECRET: Joi.string().required(),
  GOOGLE_CALLBACK_URL: Joi.string().required(),

  FACEBOOK_APP_ID: Joi.string().required(),
  FACEBOOK_APP_SECRET: Joi.string().required(),
  FACEBOOK_CALLBACK_URL: Joi.string().required(),
});
