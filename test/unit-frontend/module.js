'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Unified Inbox Angular module', function() {

  var jmapClient, jmapDraft;

  beforeEach(function() {
    angular.mock.module('esn.core');
    angular.mock.module('linagora.esn.unifiedinbox', function($provide) {
      jmapClient = {
        getMailboxes: function() {
          return $q.when([new jmapDraft.Mailbox({}, 'id_inbox', 'name_inbox', { role: 'inbox' })]);
        },
        getMessageList: function(options) {
          expect(options.filter.inMailboxes).to.deep.equal(['id_inbox']);

          return $q.when({
            getMessages: function() { return $q.when([]); },
            getThreads: function() { return $q.when([]); }
          });
        }
      };

      $provide.value('withJmapClient', function(cb) {
        return cb(jmapClient);
      });
    });
  });

  function expectSingleProvider(name, done, specificProvider) {
    inject(function($rootScope, inboxProviders, searchProviders, _jmapDraft_) {
      jmapDraft = _jmapDraft_;

      $rootScope.$digest();

      var providers = {
        inboxProviders: inboxProviders,
        searchProviders: searchProviders
      };

      specificProvider = specificProvider || 'inboxProviders';

      providers[specificProvider].getAll().then(function(providers) {
        expect(providers.length).to.equal(1);
        expect(providers[0].name).to.equal(name);

        done();
      });
      $rootScope.$digest();
    });
  }

  it('should register a search provider', function(done) {
    module(function($provide) {
      $provide.constant('esnConfig', function() {
        return $q.when();
      });
    });

    expectSingleProvider('Emails', done, 'searchProviders');
  });

  it('should register a provider for messages, if there is no configuration', function(done) {
    module(function($provide) {
      $provide.value('esnConfig', function(key, defaultValue) {
        return $q.when(defaultValue);
      });
    });

    expectSingleProvider('Emails', done);
  });

  it('should register a provider for messages, if view=messages', function(done) {
    module(function($provide) {
      $provide.value('esnConfig', function() {
        return $q.when('messages');
      });
    });

    expectSingleProvider('Emails', done);
  });

  it('should register a provider for threads, if view=threads', function(done) {
    module(function($provide) {
      $provide.value('esnConfig', function() {
        return $q.when('threads');
      });
    });

    expectSingleProvider('inboxHostedMailThreadsProvider', done);
  });

});
