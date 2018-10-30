'use strict';

var Bus = require('../../../src/lib/bus');
var BraintreeError = require('../../../src/lib/braintree-error');
var Promise = require('../../../src/lib/promise');
var basicComponentVerification = require('../../../src/lib/basic-component-verification');
var events = require('../../../src/hosted-fields/shared/constants').events;
var hostedFields = require('../../../src/hosted-fields');
var HostedFields = require('../../../src/hosted-fields/external/hosted-fields');
var fake = require('../../helpers/fake');

function callFrameReadyHandler() {
  setTimeout(function () { // allow hosted fields to begin set up before finding bus handler
    var frameReadyHandler = Bus.prototype.on.withArgs(events.FRAME_READY).getCall(0).args[1];

    frameReadyHandler({field: 'cvv'}, function () {});
  }, 100);
}

describe('hostedFields', function () {
  describe('create', function () {
    beforeEach(function () {
      this.fakeClient = fake.client();
      this.fakeAuthorization = fake.clientToken;
      this.fakeClient._request = function () {};
      this.sandbox.stub(basicComponentVerification, 'verify').resolves();
    });

    it('verifies with basicComponentVerification with client', function (done) {
      var client = this.fakeClient;

      hostedFields.create({
        client: client,
        fields: {
          cvv: {selector: '#cvv'}
        }
      }, function () {
        expect(basicComponentVerification.verify).to.be.calledOnce;
        expect(basicComponentVerification.verify).to.be.calledWithMatch({
          name: 'Hosted Fields',
          client: client
        });
        done();
      });
    });

    it('verifies with basicComponentVerification with authorization', function (done) {
      var authorization = this.fakeAuthorization;

      hostedFields.create({
        authorization: authorization,
        fields: {
          cvv: {selector: '#cvv'}
        }
      }, function () {
        expect(basicComponentVerification.verify).to.be.calledOnce;
        expect(basicComponentVerification.verify).to.be.calledWithMatch({
          name: 'Hosted Fields',
          authorization: authorization
        });
        done();
      });
    });

    it('instantiates a Hosted Fields integration', function (done) {
      var cvvNode = document.createElement('div');

      cvvNode.id = 'cvv';
      document.body.appendChild(cvvNode);

      hostedFields.create({
        client: this.fakeClient,
        fields: {
          cvv: {selector: '#cvv'}
        }
      }, function (err, thingy) {
        expect(err).not.to.exist;
        expect(thingy).to.be.an.instanceof(HostedFields);

        done();
      });

      callFrameReadyHandler();
    });

    it('calls callback with timeout error', function (done) {
      var cvvNode = document.createElement('div');

      this.sandbox.stub(HostedFields.prototype, 'on').withArgs('timeout').yields();
      cvvNode.id = 'cvv';
      document.body.appendChild(cvvNode);

      hostedFields.create({
        client: this.fakeClient,
        fields: {
          cvv: {selector: '#cvv'}
        }
      }, function (err, thingy) {
        expect(thingy).to.not.exist;
        expect(err).to.be.an.instanceof(BraintreeError);
        expect(err.code).to.equal('HOSTED_FIELDS_TIMEOUT');
        expect(err.type).to.equal('UNKNOWN');
        expect(err.message).to.equal('Hosted Fields timed out when attempting to set up.');

        done();
      });
    });

    it('returns a promise', function () {
      var promise;
      var cvvNode = document.createElement('div');

      cvvNode.id = 'cvv';
      document.body.appendChild(cvvNode);

      promise = hostedFields.create({
        client: this.fakeClient,
        fields: {
          cvv: {selector: '#cvv'}
        }
      });

      expect(promise).to.be.an.instanceof(Promise);
    });

    it('returns error if hosted fields integration throws an error', function (done) {
      hostedFields.create({
        fields: {
          cvv: {selector: '#cvv'}
        }
      }, function (err) {
        expect(err).to.exist;

        done();
      });
    });
  });

  describe('supportsInputFormatting', function () {
    it('returns a boolean', function () {
      expect(hostedFields.supportsInputFormatting()).to.be.a('boolean');
    });
  });
});
