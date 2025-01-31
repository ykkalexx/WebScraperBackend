import Joi from "joi";
import { Request, Response, NextFunction } from "express";

// Validation middleware
export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(", ");

      return res.status(400).json({
        error: "Validation error",
        details: errorMessage,
      });
    }

    next();
  };
};

// Validation schemas
const selectorsSchema = Joi.object({
  title: Joi.string().required(),
  price: Joi.string().optional(),
  description: Joi.string().optional(),
}).min(1);

const optionsSchema = Joi.object({
  maxPages: Joi.number().integer().min(1).default(1),
  waitTime: Joi.number().integer().min(0).default(1000),
  retryAttempts: Joi.number().integer().min(1).default(3),
  concurrent: Joi.boolean().default(false),
  nextPageSelector: Joi.string().optional(),
  userAgent: Joi.string().optional(),
});

export const singleScrapeSchema = Joi.object({
  url: Joi.string().uri().required(),
  item: Joi.string().required(),
  selectors: selectorsSchema.required(),
  options: optionsSchema.optional(),
});

export const bulkScrapeSchema = Joi.object({
  urls: Joi.array().items(Joi.string().uri()).min(1).required(),
  item: Joi.string().required(),
  selectors: selectorsSchema.required(),
  options: optionsSchema.optional(),
});

export const seoSchema = Joi.object({
  url: Joi.string().uri().required(),
});
