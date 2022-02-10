'use strict';

/**
 * generator-config router.
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::generator-config.generator-config');
