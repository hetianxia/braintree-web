'use strict';
/**
 * @module braintree-web/unionpay
 * @description This module allows you to accept UnionPay payments. *It is currently in beta and is subject to change.*
 */

var UnionPay = require('./shared/unionpay');
var BraintreeError = require('../lib/braintree-error');
var analytics = require('../lib/analytics');
var deferred = require('../lib/deferred');
var throwIfNoCallback = require('../lib/throw-if-no-callback');
var errors = require('./shared/errors');
var sharedErrors = require('../lib/errors');
var VERSION = process.env.npm_package_version;

/**
* @static
* @function create
* @param {object} options Creation options:
* @param {Client} options.client A {@link Client} instance.
* @param {callback} callback The second argument, `data`, is the {@link UnionPay} instance.
* @returns {void}
* @example
* braintree.unionpay.create({ client: clientInstance }, function (createErr, unionpayInstance) {
*   if (createErr) {
*     console.error(createErr);
*     return;
*   }
*   // ...
* });
*/
function create(options, callback) {
  var config, clientVersion;

  throwIfNoCallback(callback, 'create');

  callback = deferred(callback);

  if (options.client == null) {
    callback(new BraintreeError({
      type: sharedErrors.INSTANTIATION_OPTION_REQUIRED.type,
      code: sharedErrors.INSTANTIATION_OPTION_REQUIRED.code,
      message: 'options.client is required when instantiating UnionPay.'
    }));
    return;
  }

  config = options.client.getConfiguration();
  clientVersion = config.analyticsMetadata.sdkVersion;

  if (clientVersion !== VERSION) {
    callback(new BraintreeError({
      type: sharedErrors.INCOMPATIBLE_VERSIONS.type,
      code: sharedErrors.INCOMPATIBLE_VERSIONS.code,
      message: 'Client (version ' + clientVersion + ') and UnionPay (version ' + VERSION + ') components must be from the same SDK version.'
    }));
    return;
  }

  if (!config.gatewayConfiguration.unionPay || config.gatewayConfiguration.unionPay.enabled !== true) {
    callback(new BraintreeError(errors.UNIONPAY_NOT_ENABLED));
    return;
  }

  analytics.sendEvent(options.client, 'unionpay.initialized');

  callback(null, new UnionPay(options));
}

module.exports = {
  create: create,
  /**
   * @description The current version of the SDK, i.e. `{@pkg version}`.
   * @type {string}
   */
  VERSION: VERSION
};
