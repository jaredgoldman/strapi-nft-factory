'use strict';

/**
 * image service.
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::image.image');
