'use strict';

/**
 * generator-config service.
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::generator-config.generator-config');
