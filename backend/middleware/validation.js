/**
 * Validation Middleware
 * Validates request data using Joi schemas
 */

const Joi = require('joi');

/**
 * Factory function to create validation middleware
 * @param {Joi.Schema} schema - Joi schema to validate against
 * @param {string} property - Request property to validate ('body', 'query', 'params')
 */
exports.validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error } = schema.validate(req[property], { abortEarly: false });
    
    if (!error) {
      return next();
    }

    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors 
    });
  };
};

// Schemas for different routes

// Auth schemas
exports.schemas = {
  // Auth schemas
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    displayName: Joi.string().min(2).max(50)
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  // User schemas
  updateProfile: Joi.object({
    displayName: Joi.string().min(2).max(50),
    photoUrl: Joi.string().uri().allow(null, ''),
    settings: Joi.object({
      theme: Joi.string().valid('light', 'dark', 'system'),
      fontSizePreference: Joi.number().min(10).max(24)
    })
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).required()
  }),

  // Module schemas
  createModule: Joi.object({
    title: Joi.string().min(1).max(100).required(),
    description: Joi.string().max(500).allow(null, ''),
    color: Joi.string().allow(null, ''),
    icon: Joi.string().allow(null, '')
  }),

  updateModule: Joi.object({
    title: Joi.string().min(1).max(100),
    description: Joi.string().max(500).allow(null, ''),
    color: Joi.string().allow(null, ''),
    icon: Joi.string().allow(null, ''),
    sortOrder: Joi.number(),
    isArchived: Joi.boolean()
  }),

  reorderModules: Joi.object({
    moduleIds: Joi.array().items(Joi.string()).required()
  }),

  // Note schemas
  createNote: Joi.object({
    moduleId: Joi.string().required(),
    title: Joi.string().min(1).max(200).required(),
    content: Joi.object({
      blocks: Joi.array().items(Joi.object({
        id: Joi.string().required(),
        type: Joi.string().required(),
        content: Joi.string().allow(''),
        formatting: Joi.array().items(Joi.object({
          type: Joi.string().required(),
          start: Joi.number().required(),
          end: Joi.number().required()
        })),
        metadata: Joi.object().unknown(true)
      })),
      version: Joi.string().required(),
      plainText: Joi.string().allow('')
    }),
    tags: Joi.array().items(Joi.string()),
    isStarred: Joi.boolean()
  }),

  updateNote: Joi.object({
    title: Joi.string().min(1).max(200),
    content: Joi.object({
      blocks: Joi.array().items(Joi.object({
        id: Joi.string().required(),
        type: Joi.string().required(),
        content: Joi.string().allow(''),
        formatting: Joi.array().items(Joi.object({
          type: Joi.string().required(),
          start: Joi.number().required(),
          end: Joi.number().required()
        })),
        metadata: Joi.object().unknown(true)
      })),
      version: Joi.string().required(),
      plainText: Joi.string().allow('')
    }),
    tags: Joi.array().items(Joi.string()),
    isStarred: Joi.boolean(),
    isArchived: Joi.boolean(),
    moduleId: Joi.string(),
    sortOrder: Joi.number()
  }),

  // Tag schemas
  createTag: Joi.object({
    name: Joi.string().min(1).max(50).required(),
    color: Joi.string().allow(null, '')
  }),

  updateTag: Joi.object({
    name: Joi.string().min(1).max(50),
    color: Joi.string().allow(null, '')
  })
};