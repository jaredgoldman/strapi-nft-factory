'use strict';

/**
 * layer service.
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::layer.layer');
