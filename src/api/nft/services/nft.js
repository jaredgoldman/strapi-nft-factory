'use strict';

/**
 * nft service.
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::nft.nft');
