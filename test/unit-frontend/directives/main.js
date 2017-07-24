'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The linagora.esn.unifiedinbox Main module directives', function() {

  var $compile, $rootScope, $scope, $timeout, $templateCache, element, jmapClient, inboxPlugins,
      iFrameResize = angular.noop, elementScrollService, $stateParams, $dropdown,
      isMobile, searchService, autosize, windowMock, fakeNotification,
      sendEmailFakePromise, cancellationLinkAction, inboxConfigMock, inboxJmapItemService, _, INBOX_EVENTS,
      notificationFactory, esnPreviousPage;

  beforeEach(function() {
    angular.module('esn.iframe-resizer-wrapper', []);

    angular.mock.module('esn.ui');
    angular.mock.module('esn.core');
    angular.mock.module('esn.session');
    angular.mock.module('esn.configuration');
    angular.mock.module('esn.dropdownList');
    angular.mock.module('esn.previous-page');
    angular.mock.module('linagora.esn.unifiedinbox');
    angular.mock.module('esn.datetime', function($provide) {
      $provide.constant('ESN_DATETIME_DEFAULT_TIMEZONE', 'UTC');
    });
    module('jadeTemplates');
  });

  beforeEach(module(function($provide) {
    isMobile = false;
    windowMock = {
      open: sinon.spy()
    };
    inboxConfigMock = {};

    $provide.constant('MAILBOX_ROLE_ICONS_MAPPING', {
      testrole: 'testclass',
      default: 'defaultclass'
    });
    jmapClient = {};
    $provide.constant('withJmapClient', function(callback) {
      return callback(jmapClient);
    });
    $provide.provider('iFrameResize', {
      $get: function() {
        return iFrameResize;
      }
    });
    $provide.value('elementScrollService', elementScrollService = {
      autoScrollDown: sinon.spy(),
      scrollDownToElement: sinon.spy()
    });
    $provide.value('$dropdown', $dropdown = sinon.spy());
    $provide.decorator('$window', function($delegate) {
      return angular.extend($delegate, windowMock);
    });
    $provide.value('Fullscreen', {});
    $provide.value('ASTrackerController', {});
    $provide.value('deviceDetector', { isMobile: function() { return isMobile;} });
    $provide.value('searchService', searchService = { searchRecipients: angular.noop });
    $provide.value('autosize', autosize = sinon.spy());
    $provide.value('inboxConfig', function(key, defaultValue) {
      return $q.when(angular.isDefined(inboxConfigMock[key]) ? inboxConfigMock[key] : defaultValue);
    });

    fakeNotification = { update: function() {}, setCancelAction: sinon.spy() };
    $provide.value('notifyService', function() { return fakeNotification; });
    $provide.value('sendEmail', sinon.spy(function() { return sendEmailFakePromise; }));
    $provide.decorator('$state', function($delegate) {
      $delegate.go = sinon.spy();

      return $delegate;
    });
    $provide.value('inboxIdentitiesService', {
      getAllIdentities: function() {
        return $q.when([{ isDefault: true, id: 'default' }]);
      }
    });
    $provide.value('localTimezone', 'UTC');
  }));

  beforeEach(inject(function(_$compile_, _$rootScope_, _$timeout_, _$stateParams_, _$templateCache_, session, _inboxJmapItemService_,
                             _inboxPlugins_, ___, _INBOX_EVENTS_, _notificationFactory_, _esnPreviousPage_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    $timeout = _$timeout_;
    $stateParams = _$stateParams_;
    $templateCache = _$templateCache_;
    inboxJmapItemService = _inboxJmapItemService_;
    inboxPlugins = _inboxPlugins_;
    _ = ___;
    esnPreviousPage = _esnPreviousPage_;
    INBOX_EVENTS = _INBOX_EVENTS_;
    notificationFactory = _notificationFactory_;

    session.user = {
      preferredEmail: 'user@open-paas.org',
      emails: ['user@open-paas.org']
    };
  }));

  beforeEach(function() {
    $scope = $rootScope.$new();
  });

  afterEach(function() {
    if (element) {
      element.remove();
    }
  });

  function compileDirective(html, data) {
    element = angular.element(html);
    element.appendTo(document.body);

    if (data) {
      Object.keys(data).forEach(function(key) {
        element.data(key, data[key]);
      });
    }

    $compile(element)($scope);
    $scope.$digest();

    return element;
  }

  describe('The newComposer directive', function() {

    var newComposerService;

    beforeEach(inject(function(_newComposerService_) {
      newComposerService = _newComposerService_;
    }));

    it('should call the open fn from newComposerService when clicked', function() {
      var testee = compileDirective('<div new-composer/>');

      newComposerService.open = sinon.spy();

      testee.click();

      expect(newComposerService.open).to.have.been.calledOnce;
      expect(newComposerService.open).to.have.been.calledWith({});
    });

  });

  describe('The opInboxCompose directive', function() {

    var newComposerService, emailElement;

    beforeEach(inject(function(_newComposerService_) {
      newComposerService = _newComposerService_;
    }));

    it('should call the open fn when clicked on mailto link', function() {
      emailElement = compileDirective('<a ng-href="mailto:SOMEONE" op-inbox-compose op-inbox-compose-display-name="SOMETHING"/>');
      newComposerService.open = sinon.spy();

      emailElement.click();
      expect(newComposerService.open).to.have.been.calledWith({
        to: [{
          email: 'SOMEONE',
          name: 'SOMETHING'
        }]
      });
    });

    it('should call the open fn when put email in opInboxCompose attribute', function() {
      emailElement = compileDirective('<a op-inbox-compose="SOMEONE" op-inbox-compose-display-name="SOMETHING"/>');
      newComposerService.open = sinon.spy();

      emailElement.click();
      expect(newComposerService.open).to.have.been.calledWith({
        to: [{
          email: 'SOMEONE',
          name: 'SOMETHING'
        }]
      });
    });

    it('should call the preventDefault and stopPropagation fn when clicked on mailto link', function() {
      emailElement = compileDirective('<a op-inbox-compose ng-href="mailto:SOMEONE" op-inbox-compose-display-name="SOMETHING"/>');
      var event = {
        type: 'click',
        preventDefault: sinon.spy(),
        stopPropagation: sinon.spy()
      };

      emailElement.trigger(event);

      expect(event.preventDefault).to.have.been.called;
      expect(event.stopPropagation).to.have.been.called;
    });

    it('should not call the open fn when the link does not contain mailto', function() {
      emailElement = compileDirective('<a ng-href="tel:SOMEONE"/>');
      newComposerService.open = sinon.spy();

      emailElement.click();

      expect(newComposerService.open).to.have.not.been.called;
    });

    it('should not call the open fn when the link does not mailto and opInboxCompose attribute is undefined', function() {
      emailElement = compileDirective('<a op-inbox-compose />');
      newComposerService.open = sinon.spy();

      emailElement.click();

      expect(newComposerService.open).to.have.not.been.called;
    });

    it('should not call the open fn when the link does not mailto and opInboxCompose attribute is default', function() {
      emailElement = compileDirective('<a op-inbox-compose="op-inbox-compose" />');
      newComposerService.open = sinon.spy();

      emailElement.click();

      expect(newComposerService.open).to.have.not.been.called;
    });

    it('should call the open fn with correct email', function() {
      emailElement = compileDirective('<a ng-href="mailto:SOMEONE" op-inbox-compose="SOMEBODY" />');
      newComposerService.open = sinon.spy();

      emailElement.click();

      expect(newComposerService.open).to.have.been.calledWith({
        to: [{
          email: 'SOMEONE',
          name: 'SOMEONE'
        }]
      });
    });

    it('should it should use the email address as the display name if display name is not defined', function() {
      emailElement = compileDirective('<a op-inbox-compose ng-href="mailto:SOMEONE"/>');
      newComposerService.open = sinon.spy();

      emailElement.click();

      expect(newComposerService.open).to.have.been.calledWith({
        to: [{
          email: 'SOMEONE',
          name: 'SOMEONE'
        }]
      });
    });

    it('should call the open fn when clicked on mailto link with multiple mails', function() {
      emailElement = compileDirective('<a ng-href="mailto:SOMEONE1,SOMEONE2,SOMEONE3" op-inbox-compose/>');
      newComposerService.open = sinon.spy();

      emailElement.click();
      expect(newComposerService.open).to.have.been.calledWith({
        to: [{
          email: 'SOMEONE1',
          name: 'SOMEONE1'
        },
        {
          email: 'SOMEONE2',
          name: 'SOMEONE2'
        },
        {
          email: 'SOMEONE3',
          name: 'SOMEONE3'
        }]
      });
    });
  });

  describe('The mailboxDisplay directive', function() {

    it('should define $scope.mailboxIcons to default value if mailbox has no role', function() {
      $scope.mailbox = {
        role: {
          value: null
        },
          qualifiedName: 'test'
      };
      compileDirective('<mailbox-display mailbox="mailbox" />');

      expect(element.isolateScope().mailboxIcons).to.equal('defaultclass');
    });

    it('should define $scope.mailboxIcons to the correct value when mailbox has a role', function() {
      $scope.mailbox = {
        role: {
          value: 'testrole'
        },
          qualifiedName: 'test'
      };
      compileDirective('<mailbox-display mailbox="mailbox" />');

      expect(element.isolateScope().mailboxIcons).to.equal('testclass');
    });

    it('should define $scope.mailboxIcons to a custom one, if provided by a custom mailbox', function() {
      $scope.mailbox = {
        role: {
          value: 'custom role'
        },
          qualifiedName: 'test',
          icon: 'mdi-custom-icon'
      };
      compileDirective('<mailbox-display mailbox="mailbox" />');

      expect(element.isolateScope().mailboxIcons).to.equal('mdi-custom-icon');
    });

    it('should define $scope.hideBadge to the correct value', function() {
      $scope.mailbox = {
        role: {
          value: null
        },
          qualifiedName: 'test'
      };
      compileDirective('<mailbox-display mailbox="mailbox" hide-badge=true />');

      expect(element.isolateScope().hideBadge).to.equal('true');
    });

    describe('The dragndrop feature', function() {

      var isolateScope;

      beforeEach(function() {
        $scope.mailbox = {
          id: '1',
          role: {
            value: 'testrole'
          },
          qualifiedName: 'test'
        };
        compileDirective('<mailbox-display mailbox="mailbox" />');

        isolateScope = element.isolateScope();
      });

      it('should be droppable element', function() {
        expect(element.attr('esn-droppable')).to.equal('esn-droppable');
      });

      describe('The onDrop function', function() {
        var inboxJmapItemService;

        beforeEach(inject(function(_inboxJmapItemService_) {
          inboxJmapItemService = _inboxJmapItemService_;

          inboxJmapItemService.moveMultipleItems = sinon.spy(function() {
            return $q.when();
          });
        }));

        it('should delegate to inboxJmapItemService.moveMultipleItems', function() {
          var item1 = { id: 1 },
              item2 = { id: 2 };

          isolateScope.onDrop([item1, item2]);

          expect(inboxJmapItemService.moveMultipleItems).to.have.been.calledWith([item1, item2], $scope.mailbox);
        });

      });

      describe('The isDropZone function', function() {

        var inboxMailboxesService;

        beforeEach(inject(function(_inboxMailboxesService_) {
          inboxMailboxesService = _inboxMailboxesService_;
          inboxMailboxesService.canMoveMessage = sinon.spy(function() {
            return true;
          });
        }));

        it('should check result from inboxMailboxesService.canMoveMessage for a single item', function() {
          var item = {
            mailboxIds: ['2']
          };

          isolateScope.isDropZone([item]);

          expect(inboxMailboxesService.canMoveMessage).to.have.been.calledOnce;
          expect(inboxMailboxesService.canMoveMessage).to.have.been.calledWith(item, $scope.mailbox);
        });

        it('should check result from inboxMailboxesService.canMoveMessage for multiple items', function() {
          var item = {
            id: '1',
            mailboxIds: ['2']
          };
          var item2 = {
            id: '2',
            mailboxIds: ['3']
          };

          isolateScope.isDropZone([item, item2]);

          expect(inboxMailboxesService.canMoveMessage).to.have.been.calledTwice;
          expect(inboxMailboxesService.canMoveMessage).to.have.been.calledWith(item, $scope.mailbox);
          expect(inboxMailboxesService.canMoveMessage).to.have.been.calledWith(item2, $scope.mailbox);
        });

      });

    });

  });

  describe('The composer directive', function() {

    var $state, $stateParams;

    beforeEach(inject(function(_$state_, _$stateParams_) {
      $state = _$state_;
      $stateParams = _$stateParams_;
    }));

    it('should return false when isBoxed is called', function() {
      compileDirective('<composer />');

      expect($scope.isBoxed()).to.equal(false);
    });

    it('should call state.go with the given type, the controller composition and page history replace option', function(done) {
      var directive = compileDirective('<composer />');

      directive.controller('composer').initCtrl({});

      $state.go = sinon.spy(function(recipientsType, params, options) {
        expect(recipientsType).to.equal('.recipients');
        expect(params).to.shallowDeepEqual({
          recipientsType: 'to',
          composition: {
            draft: { originalEmailState: { bcc: [], cc: [], to: [] } },
            email: { bcc: [], cc: [], to: [] }
          }
        });
        expect(options).to.shallowDeepEqual({ location: 'replace' });
        done();
      });

      $scope.openRecipients('to');
    });

    describe('its controller', function() {

      var directive, ctrl, toState = { name: 'toStateName' };

      beforeEach(function() {
        $stateParams.previousState = {
          name: 'previousStateName',
          params: 'previousStateParams'
        };

        directive = compileDirective('<composer />');
        ctrl = directive.controller('composer');
        ctrl.saveDraft = sinon.spy();
        $state.go = sinon.spy();
        esnPreviousPage.back = sinon.spy();
      });

      it('should save draft when state has successfully changed', function() {
        $rootScope.$broadcast('$stateChangeSuccess', toState);

        expect(ctrl.saveDraft).to.have.been.calledOnce;
      });

      it('should not save draft when state has successfully changed to a state with ignoreSaveAsDraft=true', function() {
        $rootScope.$broadcast('$stateChangeSuccess', { data: { ignoreSaveAsDraft: true } });

        expect(ctrl.saveDraft).to.have.not.been.calledWith();
      });

      it('should disable the listener when state has successfully changed to a state with ignoreSaveAsDraft=true', function() {
        $rootScope.$broadcast('$stateChangeSuccess', { data: { ignoreSaveAsDraft: true } });
        $rootScope.$broadcast('$stateChangeSuccess', toState);

        expect(ctrl.saveDraft).to.have.not.been.calledWith();
      });

      it('should save draft only once when close is called, then location has successfully changed', function() {
        $scope.close();
        $rootScope.$broadcast('$stateChangeSuccess', toState);

        expect(ctrl.saveDraft).to.have.been.calledOnce;
      });

      it('should save draft when the composer is closed', function() {
        $scope.close();

        expect(ctrl.saveDraft).to.have.been.calledOnce;
      });

      it('should not save a draft when the composer is hidden', function() {
        $scope.hide();

        expect(ctrl.saveDraft).to.have.not.been.called;
      });

      it('should back to previous page with correct parameters when the composer is hidden', function() {
        $scope.hide();

        expect(esnPreviousPage.back).to.have.been.calledOnce;
        expect(esnPreviousPage.back).to.have.been.calledWith('unifiedinbox');
      });

      function sendDraftWhileOffline(email) {
        sendEmailFakePromise = $q.reject(new Error('Cannot send'));
        directive = compileDirective('<composer />');
        ctrl = directive.controller('composer');
        ctrl.initCtrl(email);

        $scope.send();
        $scope.$digest();
      }

      it('should notify of error featuring a resume action when sending offline', function() {
        var aFakeEmail = {
          to: [{ name: 'bob@example.com', email: 'bob@example.com'}], cc: [], bcc: [],
          subject: 'le sujet', htmlBody: '<p>Le contenu</p>'
        };

        sendDraftWhileOffline(aFakeEmail);

        expect(fakeNotification.setCancelAction).to.have.been.calledWithMatch(sinon.match({
          action: sinon.match.func,
          linkText: 'Reopen the composer'
        }));
      });

      it('should reopen composer when resuming after sending failed', inject(function(newComposerService) {
        var aFakeEmail = {
          to: [{ name: 'bob@example.com', email: 'bob@example.com'}], cc: [], bcc: [],
          subject: 'le sujet', htmlBody: '<p>Le contenu</p>',
          attachments: []
        };

        newComposerService.open = sinon.spy();

        sendDraftWhileOffline(aFakeEmail);

        cancellationLinkAction = fakeNotification.setCancelAction.getCalls()[0].args[0].action;
        // act
        cancellationLinkAction();
        // assert
        expect(newComposerService.open).to.have.been.calledWithMatch(aFakeEmail);
      }));
    });

    describe('The mobile header buttons', function() {

      var mainHeader, ctrl;

      beforeEach(inject(function($httpBackend) {

        $httpBackend.whenGET('/views/modules/header/search/search-header.html').respond(200, '<div>');
        $httpBackend.whenGET('/views/modules/header/profile-menu/profile-menu.html').respond(200, '<div>');

        ctrl = compileDirective('<composer/>').controller('composer');
        ctrl.saveDraft = angular.noop;
        mainHeader = compileDirective('<main-header/>');
      }));

      it('should bind the send button to the scope method', function() {
        $scope.send = sinon.spy();

        mainHeader.find('.module-subheader .send').click();

        expect($scope.send).to.have.been.called;
      });

      it('should bind the close button to the scope method', function() {
        $scope.close = sinon.spy();

        mainHeader.find('.module-subheader .close.button').click();

        expect($scope.close).to.have.been.called;
      });
    });

    describe('The editQuotedMail function', function() {

      function expectFocusAt(position) {
        var textarea = element.find('.compose-body').get(0);

        expect(document.activeElement).to.equal(textarea);
        expect(textarea.selectionStart).to.equal(position);
        expect(textarea.selectionEnd).to.equal(position);
      }

      beforeEach(inject(function(emailBodyService) {
        isMobile = true;
        autosize.update = sinon.spy();

        emailBodyService.bodyProperty = 'textBody';
      }));

      beforeEach(function() {
        $stateParams.email = {
          to: [],
          cc: [],
          bcc: []
        };

        $stateParams.previousState = {
          name: 'unifiedinbox.inbox',
          params: {}
        };
      });

      afterEach(function() {
        delete $stateParams.email;
      });

      it('should quote the original message, and set it as the textBody', function(done) {
        compileDirective('<composer />');
        $scope.email = {
          quoted: {
            date: '2015-08-21T00:10:00Z',
            from: {email: 'sender@linagora.com', name: 'linagora'},
            textBody: 'Hello'
          }
        };

        $scope.editQuotedMail().then(function() {
          expect($scope.email.isQuoting).to.equal(true);
          expect($scope.email.textBody).to.equal('\n\n\n\u0000On Aug 21, 2015 12:10 AM, from sender@linagora.com:\n\n> Hello');

          done();
        });
        $rootScope.$digest();
      });

      it('should scroll the viewport down to the email body (.compose-body)', function() {
        compileDirective('<composer />');
        $scope.email = {
          quoted: {
            textBody: 'Hello'
          }
        };

        $scope.editQuotedMail();
        $rootScope.$digest();
        $timeout.flush();

        expect(elementScrollService.scrollDownToElement).to.have.been.calledWith(sinon.match({
          selector: '.compose-body'
        }));
      });

      it('should focus the email body, at the very beginning if there was no text already', function() {
        compileDirective('<composer />');
        $scope.email = {
          quoted: {
            textBody: 'Hello'
          }
        };

        $scope.editQuotedMail();
        $rootScope.$digest();
        $timeout.flush();

        expectFocusAt(0);
      });

      it('should focus the email body, after an already typed text if present', function() {
        compileDirective('<composer />');
        $scope.email = {
          textBody: 'I am 18 chars long',
          quoted: {
            textBody: 'Hello'
          }
        };

        $scope.editQuotedMail();
        $rootScope.$digest();
        $timeout.flush();

        expectFocusAt(18);
      });

      it('should update autosize() on the email body', function() {
        compileDirective('<composer />');

        $scope.editQuotedMail();
        $rootScope.$digest();
        $timeout.flush();

        expect(autosize.update).to.have.been.calledWith(element.find('.compose-body').get(0));
      });

      it('should not save a draft if the user\'s only change is a press on Edit Quoted Mail', function() {
        jmapClient.saveAsDraft = sinon.spy();
        $state.go = angular.noop;

        compileDirective('<composer />');
        $scope.editQuotedMail();
        $rootScope.$digest();
        $timeout.flush();

        $scope.close();
        $rootScope.$digest();

        expect(jmapClient.saveAsDraft.callCount).to.equal(0);
      });

      it('should still save a draft if the user changes body then presses on Edit Quoted Mail', function() {
        inboxConfigMock.drafts = true;
        jmapClient.saveAsDraft = sinon.spy(function() {
          return $q.when({});
        });
        $state.go = angular.noop;

        compileDirective('<composer />');
        $scope.email.textBody = 'the user has written this';
        $scope.editQuotedMail();
        $rootScope.$digest();
        $timeout.flush();

        $scope.close();
        $rootScope.$digest();

        expect(jmapClient.saveAsDraft.callCount).to.equal(1);
      });

      it('should still save a draft if the user changes recipients then presses on Edit Quoted Mail', function() {
        inboxConfigMock.drafts = true;
        jmapClient.saveAsDraft = sinon.spy(function() {
          return $q.when({});
        });
        $state.go = angular.noop;

        compileDirective('<composer />');
        $scope.email.to = [{
          email: 'SOMEONE',
          name: 'SOMEONE'
        }];
        $scope.editQuotedMail();
        $rootScope.$digest();
        $timeout.flush();

        $scope.close();
        $rootScope.$digest();

        expect(jmapClient.saveAsDraft.callCount).to.equal(1);
      });

    });

    describe('The updateIdentity function', function() {

      var identity = {
        textSignature: 'SignatureText'
      };

      it('should update the model', function() {
        compileDirective('<composer />');

        $scope.email = {
          identity: identity
        };
        $scope.updateIdentity();

        expect($scope.email.textBody).to.equal('\n\n-- \nSignatureText\n\n');
      });

      it('should insert the signature when there is no text, with blank lines before and after', function() {
        compileDirective('<composer />');

        $scope.email = {
          identity: identity
        };
        $scope.updateIdentity();

        expect($scope.email.textBody).to.equal('\n\n-- \nSignatureText\n\n');
      });

      it('should insert the signature after existing text', function() {
        compileDirective('<composer />');

        $scope.email = {
          textBody: 'ExistingText\n',
          identity: identity
        };
        $scope.updateIdentity();

        expect($scope.email.textBody).to.equal('ExistingText\n-- \nSignatureText\n\n');
      });

      it('should insert the signature after existing text and before quote if present', function() {
        compileDirective('<composer />');

        $scope.email = {
          textBody: 'Line 1\nLine 2\n\n\x00Quote',
          identity: identity
        };
        $scope.updateIdentity();

        expect($scope.email.textBody).to.equal('Line 1\nLine 2\n\n-- \nSignatureText\n\n\x00Quote');
      });

      it('should replace an existing signature when there is no quote', function() {
        compileDirective('<composer />');

        $scope.email = {
          textBody: 'ExistingText\n-- \nOld Signature',
          identity: identity
        };
        $scope.updateIdentity();

        expect($scope.email.textBody).to.equal('ExistingText\n-- \nSignatureText\n\n');
      });

      it('should replace an existing signature when there is a quote present', function() {
        compileDirective('<composer />');

        $scope.email = {
          textBody: 'ExistingText\n-- \nOld Signature\n\x00Quote',
          identity: identity
        };
        $scope.updateIdentity();

        expect($scope.email.textBody).to.equal('ExistingText\n-- \nSignatureText\n\n\x00Quote');
      });

      it('should update autosize() on the email body', function() {
        autosize.update = sinon.spy();

        compileDirective('<composer />');

        $scope.email = {
          identity: identity
        };
        $scope.updateIdentity();
        $timeout.flush();

        expect(autosize.update).to.have.been.calledWith(element.find('.compose-body').get(0));
      });

      it('should remove an existing signature if selected identity has no signature defined', function() {
        compileDirective('<composer />');

        $scope.email = {
          textBody: 'ExistingText\n-- \nOld Signature\n\x00Quote',
          identity: {}
        };
        $scope.updateIdentity();

        expect($scope.email.textBody).to.equal('ExistingText\n\x00Quote');
      });

    });

  });

  describe('The composer-desktop directive', function() {
    beforeEach(function() {
      $scope.$updateTitle = angular.noop;
    });

    it('should return true when isBoxed is called', function() {
      compileDirective('<composer-desktop />');

      expect($scope.isBoxed()).to.equal(true);
    });

    it('should save draft when the composer is destroyed', function() {
      var ctrl = compileDirective('<composer-desktop />').controller('composerDesktop');

      ctrl.saveDraft = sinon.spy();

      $scope.$emit('$destroy');

      expect(ctrl.saveDraft).to.have.been.called;
    });

    it('should delegate the hide fn to the box\'s $hide fn', function() {
      $scope.$hide = sinon.spy();
      compileDirective('<composer-desktop />');

      $scope.hide();

      expect($scope.$hide).to.have.been.called;
    });

    it('should initialize the controller with expected compositionOptions', function() {
      $scope.compositionOptions = { expected: 'options' };
      var controller = compileDirective('<composer-desktop/>').controller('composerDesktop');

      controller.initCtrl = sinon.spy();
      $timeout.flush();

      expect(controller.initCtrl).to.have.been.calledWith(sinon.match.any, { expected: 'options' });
    });

    it('should initialize the controller with summernote\'s initial value when composing from scratch', function() {
      var controller = compileDirective('<composer-desktop/>').controller('composerDesktop');

      controller.initCtrl = sinon.spy();
      $timeout.flush();

      expect(controller.initCtrl).to.have.been.calledWith(sinon.match({
        htmlBody: ''
      }));
    });

    it('should initialize the controller with summernote\'s initial value when composing from an existing email', function() {
      var controller;

      $scope.email = {
        htmlBody: '<p><br /></p>Hey'
      };
      controller = compileDirective('<composer-desktop />').controller('composerDesktop');

      controller.initCtrl = sinon.spy();
      $timeout.flush();

      expect(controller.initCtrl).to.have.been.calledWith(sinon.match({
        htmlBody: '<p><br></p>Hey' // Bogus <br> !
      }));
    });

    it('should expose an onInit function to the scope', function() {
      compileDirective('<composer-desktop />');

      expect($scope.onInit).to.be.a('function');
    });

    it('should add a new composer-desktop-attachments element', function() {
      expect(compileDirective('<composer-desktop />').find('composer-attachments')).to.have.length(1);
    });

    it('should expose updateTile method inside scope', function() {
      compileDirective('<button new-composer />');

      expect($scope.$updateTitle).to.be.a.function;
    });

    it('should focus on email body without adding tab when tab is pressed while editing subject', function() {
      compileDirective('<composer-desktop/>');

      var composerSubject = element.find('.compose-subject'),
          event = {
            type: 'keydown',
            which: 9,
            preventDefault: sinon.spy()
          };

      composerSubject.trigger(event);
      $timeout.flush();

      expect(document.activeElement).to.equal(element.find('.note-editable')[0]);
      expect(event.preventDefault).to.have.been.calledOnce;
    });

    it('should focus back on subject field without adding tab when shift + tab is pressed while in the body', function() {
      compileDirective('<composer-desktop/>');

      var composerBody = element.find('.note-editable'),
          event = {
            type: 'keydown',
            which: 9,
            shiftKey: true,
            preventDefault: sinon.spy()
          };

      composerBody.trigger(event);

      expect(document.activeElement).to.equal(element.find('.compose-subject')[0]);
      expect(event.preventDefault).to.have.been.calledOnce;
    });

    it('should not change focus when only tab is pressed while in the body', function() {
      compileDirective('<composer-desktop/>');

      var composerBody = element.find('.note-editable'),
          event = {
            type: 'keydown',
            which: 9
          };

      composerBody.focus();
      composerBody.trigger(event);

      expect(document.activeElement).to.equal(element.find('.note-editable')[0]);
    });

    it('should not change focus when non-tab key is pressed inside subject or body', function() {
      compileDirective('<composer-desktop/>');

      var composerBody = element.find('.note-editable'),
          composerSubject = element.find('.compose-subject'),
          event = {
            type: 'keydown',
            which: 13
          };

      composerBody.focus();
      composerBody.trigger(event);

      expect(document.activeElement).to.equal(element.find('.note-editable')[0]);

      composerSubject.focus();
      composerSubject.trigger(event);

      expect(document.activeElement).to.equal(element.find('.compose-subject')[0]);
    });

    describe('The focusOnRightField function', function() {

      it('should focus on To field when email is empty', function() {
        $scope.email = {};
        compileDirective('<composer-desktop />');
        $timeout.flush();

        expect(document.activeElement).to.equal(element.find('.recipients-to input').get(0));
      });

      it('should focus on To field when To field is empty', function() {
        $scope.email = {to: [] };
        compileDirective('<composer-desktop />');
        $timeout.flush();

        expect(document.activeElement).to.equal(element.find('.recipients-to input').get(0));
      });

      it('should focus on note editing field when To field is not empty', function() {
        $scope.email = {to: [{email: 'SOMEONE', name: 'SOMEONE'}] };
        compileDirective('<composer-desktop />');
        $timeout.flush();

        expect(document.activeElement).to.equal(element.find('email-body-editor .note-editable').get(0));
      });
    });

    describe('refocusing when notified to (e.g. from box-overlay)', function() {

      var ESN_BOX_OVERLAY_EVENTS;

      beforeEach(inject(function($rootScope, _ESN_BOX_OVERLAY_EVENTS_) {
        ESN_BOX_OVERLAY_EVENTS = _ESN_BOX_OVERLAY_EVENTS_;
      }));

       it('should keep focus on same field when resized', function() {
        $scope.email = {};
        compileDirective('<composer-desktop />');
        $timeout.flush();
        element.find('.compose-subject').focus();

        $scope.$broadcast(ESN_BOX_OVERLAY_EVENTS.RESIZED);

        expect(document.activeElement).to.equal(element.find('.compose-subject')[0]);
      });
    });

    describe('The updateIdentity function', function() {

      var identity = {
        textSignature: 'SignatureText'
      };

      it('should update the model', function() {
        compileDirective('<composer-desktop />');

        $scope.email = {
          identity: identity
        };
        $rootScope.$digest();
        $scope.updateIdentity();

        expect($scope.email.htmlBody).to.equal('<p><br></p><pre class="openpaas-signature">-- \nSignatureText</pre>');
      });

      it('should insert the signature when there is no text', function() {
        compileDirective('<composer-desktop />');

        $scope.email = {
          identity: identity
        };
        $rootScope.$digest();
        $scope.updateIdentity();

        expect(element.find('.note-editable').html()).to.equal('<p><br></p><pre class="openpaas-signature">-- \nSignatureText</pre>');
      });

      it('should insert the signature after existing text', function() {
        compileDirective('<composer-desktop />');

        $scope.email = {
          htmlBody: 'ExistingText',
          identity: identity
        };
        $rootScope.$digest();
        $scope.updateIdentity();

        expect(element.find('.note-editable').html()).to.equal('ExistingText<pre class="openpaas-signature">-- \nSignatureText</pre>');
      });

      it('should insert the signature after existing text and before quote if present', function() {
        compileDirective('<composer-desktop />');

        $scope.email = {
          htmlBody: 'ExistingText<cite>Cite</cite><blockquote>QuoteText</blockquote>',
          identity: identity
        };
        $rootScope.$digest();
        $scope.updateIdentity();

        expect(element.find('.note-editable').html()).to.equal('ExistingText<pre class="openpaas-signature">-- \nSignatureText</pre><cite>Cite</cite><blockquote>QuoteText</blockquote>');
      });

      it('should replace an existing signature when there is no quote', function() {
        compileDirective('<composer-desktop />');

        $scope.email = {
          htmlBody: 'ExistingText<pre class="openpaas-signature">-- \nOldSignature</pre>',
          identity: identity
        };
        $rootScope.$digest();
        $scope.updateIdentity();

        expect(element.find('.note-editable').html()).to.equal('ExistingText<pre class="openpaas-signature">-- \nSignatureText</pre>');
      });

      it('should replace an existing signature when there is a quote present', function() {
        compileDirective('<composer-desktop />');

        $scope.email = {
          htmlBody: 'ExistingText<pre class="openpaas-signature">-- \nOldSignature</pre><cite>Cite</cite><blockquote>QuoteText</blockquote>',
          identity: identity
        };
        $rootScope.$digest();
        $scope.updateIdentity();

        expect(element.find('.note-editable').html()).to.equal('ExistingText<pre class="openpaas-signature">-- \nSignatureText</pre><cite>Cite</cite><blockquote>QuoteText</blockquote>');
      });

      it('should remove an existing signature if selected identity has no signature defined', function() {
        compileDirective('<composer-desktop />');

        $scope.email = {
          htmlBody: 'ExistingText<pre class="openpaas-signature">-- \nOldSignature</pre>',
          identity: {}
        };
        $rootScope.$digest();
        $scope.updateIdentity();

        expect(element.find('.note-editable').html()).to.equal('ExistingText');
      });

    });

  });

  describe('The inboxFab directive', function() {

    var boxOverlayService, newComposerService;

    beforeEach(inject(function(_boxOverlayService_, _newComposerService_) {
      boxOverlayService = _boxOverlayService_;
      newComposerService = _newComposerService_;
    }));

    function findInnerFabButton(fab) {
      return angular.element(fab.children('button')[0]);
    }

    function expectFabToBeEnabled(button) {
      $scope.$digest();
      expect($scope.isDisabled).to.equal(false);
      expect(button.hasClass('btn-accent')).to.equal(true);
      expect(button.attr('disabled')).to.not.match(/disabled/);
    }

    function expectFabToBeDisabled(button) {
      $scope.$digest();
      expect($scope.isDisabled).to.equal(true);
      expect(button.hasClass('btn-accent')).to.equal(false);
      expect(button.attr('disabled')).to.match(/disabled/);
    }

    function compileFabDirective() {
      var fab = compileDirective('<inbox-fab></inbox-fab>');

      $timeout.flush();

      return findInnerFabButton(fab);
    }

    it('should have enabled button when space left on screen when linked', function() {
      boxOverlayService.spaceLeftOnScreen = function() {return true;};

      var button = compileFabDirective();

      expectFabToBeEnabled(button);
    });

    it('should have disabled button when no space left on screen when linked', function() {
      boxOverlayService.spaceLeftOnScreen = function() {return false;};

      var button = compileFabDirective();

      expectFabToBeDisabled(button);
    });

    it('should disable the button when no space left on screen', function() {
      var button = compileFabDirective();

      $scope.$emit('box-overlay:no-space-left-on-screen');

      expectFabToBeDisabled(button);
    });

    it('should enable the button when new space left on screen', function() {
      var button = compileFabDirective();

      $scope.$emit('box-overlay:no-space-left-on-screen');
      $scope.$emit('box-overlay:space-left-on-screen');

      expectFabToBeEnabled(button);
    });

    it('should change location when the compose fn is called', function() {
      newComposerService.open = sinon.spy();
      var fab = compileFabDirective();

      fab.click();

      expect(newComposerService.open).to.have.been.calledOnce;
    });
  });

  describe('The recipientsAutoComplete directive', function() {

    function compileDirectiveThenGetScope() {
      compileDirective('<div><recipients-auto-complete ng-model="model" template="recipients-auto-complete"></recipients-auto-complete></div>', {
        $composerController: {
          search: {}
        }
      });

      return element.find('recipients-auto-complete').isolateScope();
    }

    function newTag(tag) {
      element.find('input').scope().tagList.addText(tag);
    }

    it('should trigger an error if no template is given', function() {
      expect(function() {
        compileDirective('<div><recipients-auto-complete ng-model="model"></recipients-auto-complete></div>');
      }).to.throw(Error, 'This directive requires a template attribute');
    });

    it('should bring up email keyboard when editing using fullscreen template', function() {
      compileDirective('<div><recipients-auto-complete ng-model="model" template="fullscreen-recipients-auto-complete"></recipients-auto-complete></div>');
      var recipientInput = element.find('recipients-auto-complete tags-input');

      expect(recipientInput.attr('type')).to.equal('email');
    });

    it('should define $scope.search from searchService.searchRecipients', function(done) {
      searchService.searchRecipients = function() { done(); };
      compileDirective('<div><recipients-auto-complete ng-model="model" template="recipients-auto-complete"></recipients-auto-complete></div>', {
        $composerController: {}
      });

      element.find('recipients-auto-complete').isolateScope().search();
    });

    it('should define $scope.search from the composerDesktop directive controller', function(done) {
      searchService.searchRecipients = function() { done(); };
      compileDirective('<div><recipients-auto-complete ng-model="model" template="recipients-auto-complete"></recipients-auto-complete></div>', {
        $composerDesktopController: {}
      });

      element.find('recipients-auto-complete').isolateScope().search();
    });

    it('should scrolldown element when a tag is added and broadcast an event to inform the fullscreen-edit-form to scrolldown', function() {
      var scope = compileDirectiveThenGetScope();
      var recipient = {displayName: 'user@domain'};

      scope.onTagAdded(recipient);

      expect(elementScrollService.autoScrollDown).to.have.been.calledWith();
    });

    it('should accept to add a new tag if email does not matche the email of an existing tag', function() {
      var scope = compileDirectiveThenGetScope();

      scope.tags.push({ email: 'user@domain' });
      scope.tags.push({ email: 'user2@domain' });
      scope.tags.push({ email: 'user3@domain' });

      expect(scope.onTagAdding({ email: 'user0@domain' })).to.equal(true);
    });

    it('should refuse to add a new tag if email matches the email of an existing tag', function() {
      var scope = compileDirectiveThenGetScope();

      scope.tags.push({ email: 'user@domain' });
      scope.tags.push({ email: 'user2@domain' });
      scope.tags.push({ email: 'user3@domain' });

      expect(scope.onTagAdding({ email: 'user2@domain' })).to.equal(false);
    });

    it('should remove all fields that are not "email" or "name"', function() {
      var scope = compileDirectiveThenGetScope();
      var recipient = {
        other: 'unexpected',
        name: 'The display name field',
        displayName: 'will be discarded',
        email: 'user@domain',
        not: 'expected'
      };

      scope.onTagAdding(recipient);

      expect(recipient).to.deep.equal({
        name: 'The display name field',
        email: 'user@domain'
      });
    });

    it('should make sure "email" is defined', function() {
      var scope = compileDirectiveThenGetScope(),
          recipient = { name: 'a@a.com' };

      scope.onTagAdding(recipient);

      expect(recipient).to.deep.equal({ name: 'a@a.com', email: 'a@a.com' });
    });

    function expectTagsFromTextInput(text, tags) {
      var scope = compileDirectiveThenGetScope();

      newTag(text);

      expect(scope.tags).to.deep.equal(tags);
    }

    it('should make sure email is defined like this "<email@lin34.com>"', function() {
      expectTagsFromTextInput('<email@lin34.com>', [{ name: 'email@lin34.com', email: 'email@lin34.com' }]);
    });

    it('should make sure email is defined like this "<  email@lin34.com  >"', function() {
      expectTagsFromTextInput('<  email@lin34.com  >', [{ name: 'email@lin34.com', email: 'email@lin34.com' }]);
    });

    it('should make sure email is defined like this "   <email@lin34.com>"', function() {
      expectTagsFromTextInput('   <email@lin34.com>', [{ name: 'email@lin34.com', email: 'email@lin34.com' }]);
    });

    it('should make sure email is defined like this "<email@lin34.com>   "', function() {
      expectTagsFromTextInput('<email@lin34.com>    ', [{ name: 'email@lin34.com', email: 'email@lin34.com' }]);
    });

    it('should make sure email is defined like this "<email@lin34.com> <lin@gora.com>"', function() {
      expectTagsFromTextInput('<email@lin34.com> <lin@gora.com>', [{ name: 'email@lin34.com', email: 'email@lin34.com' }, { name: 'lin@gora.com', email: 'lin@gora.com' }]);
    });

    it('should make sure input is defined like this "name <email@lin.com>"', function() {
      expectTagsFromTextInput('test <email@lin.com>', [{ name: 'test', email: 'email@lin.com' }]);
    });

    it('should make sure input is defined like this "     name    <   email@lin.com   >"', function() {
      expectTagsFromTextInput('     name    <   email@lin.com   >', [{ name: 'name', email: 'email@lin.com' }]);
    });

    it('should make sure input is defined like this "name1 name2 <email@lin.com>"', function() {
      expectTagsFromTextInput('      name1 name2   name3 name4     <email@lin.com>', [{ name: 'name1 name2   name3 name4', email: 'email@lin.com' }]);
    });

    it('should make sure input is defined like this "test <email@lin.com> name2"', function() {
       expectTagsFromTextInput('test <email@lin.com>  name2', [{name: 'test', email: 'email@lin.com'}, {name: 'name2', email: 'name2'}]);
    });

    it('should make sure input is defined like this "name <email@lin.com> name2 <lin@gora.com>"', function() {
      expectTagsFromTextInput('name1 <email@lin.com>  name2 <email2@lin.com>', [{ name: 'name1', email: 'email@lin.com' }, { name: 'name2', email: 'email2@lin.com' }]);
    });

     it('should make sure input is defined like this "name <email@lin.com> <lin@gora.com>"', function() {
       expectTagsFromTextInput('name1 <email@lin.com>  <email2@lin.com>', [{ name: 'name1', email: 'email@lin.com' }, { name: 'email2@lin.com', email: 'email2@lin.com' }]);
    });

    it('should make sure input is defined like this "name   <   email@lin.com > name2   <  email2@lin.com  >"', function() {
       expectTagsFromTextInput('name1   <   email@lin.com >    name2   <  email2@lin.com  >', [{ name: 'name1', email: 'email@lin.com' }, { name: 'name2', email: 'email2@lin.com' }]);
    });

    it('should make sure input is defined like this "<<>>"', function() {
      expectTagsFromTextInput('<<>>', [{ name: '<', email: '<' }, { name: '>', email: '>' }]);
    });

    it('should make sure input with email is defined like this "<<lin@gora.com>>"', function() {
      expectTagsFromTextInput('<<lin@gora.com>>', [{ name: '<lin@gora.com', email: '<lin@gora.com' }, { name: '>', email: '>' }]);
    });

    it('should make sure input is defined like this ">anything<"', function() {
      expectTagsFromTextInput('>an7th|n8<', [{ name: '>an7th|n8<', email: '>an7th|n8<' }]);
    });

    it('should make sure input is defined like this "text >anything<"', function() {
      expectTagsFromTextInput('text    >@n7th|n8<', [{ name: 'text    >@n7th|n8<', email: 'text    >@n7th|n8<' }]);
    });

    it('should make sure input is defined like this "text1>text2"', function() {
      expectTagsFromTextInput('text1>text2', [{ name: 'text1>text2', email: 'text1>text2' }]);
    });

    it('should make sure input is defined like this "text1<text2"', function() {
      expectTagsFromTextInput('text1<text2', [{ name: 'text1<text2', email: 'text1<text2' }]);
    });

    it('should make sure input is defined like this "text1 text2"', function() {
      expectTagsFromTextInput('text1 text2', [{ name: 'text1 text2', email: 'text1 text2' }]);
    });

    it('should make sure input is defined like this "   text1 text2   "', function() {
       expectTagsFromTextInput('   text1 text2   ', [{ name: 'text1 text2', email: 'text1 text2' }]);
    });

    it('should initialize the model if none given', function() {
      expect(compileDirectiveThenGetScope().tags).to.deep.equal([]);
    });

    it('should use the model if one given', function() {
      $scope.model = [{ a: '1' }];

      expect(compileDirectiveThenGetScope().tags).to.deep.equal([{ a: '1' }]);
    });

  });

  describe('The emailBodyEditor', function() {
    it('should load summernote when isMobile()=false', function() {
      expect(compileDirective('<email-body-editor />').find('.summernote')).to.have.length(1);
    });

    it('should load a textarea when isMobile()=true', function() {
      isMobile = true;

      var element = compileDirective('<email-body-editor />');

      expect(element.find('textarea')).to.have.length(1);
      expect(element.find('.summernote')).to.have.length(0);
    });

  });

  describe('The email directive', function() {

    describe('the exposed functions from inboxJmapItemService', function() {
      beforeEach(function() {
        ['reply', 'replyAll', 'forward'].forEach(function(action) {
          inboxJmapItemService[action] = sinon.spy();
        });
      });

      it('should expose several functions to the element controller', function() {
        compileDirective('<email email="email"/>');

        ['reply', 'replyAll', 'forward'].forEach(function(action) {
          element.controller('email')[action]();

          expect(inboxJmapItemService[action]).to.have.been.called;
        });
      });
    });

    it('should show reply button and hide replyAll button if email.hasReplyAll is false', function() {
      $scope.email = { id: 'id', hasReplyAll: false };
      compileDirective('<email email="email"/>');

      expect(element.find('.mdi-reply').length).to.equal(1);
      expect(element.find('.mdi-reply-all').length).to.equal(0);
    });

    it('should hide reply button and show replyAll button if email.hasReplyAll is true', function() {
      $scope.email = { id: 'id', hasReplyAll: true };
      compileDirective('<email email="email"/>');

      expect(element.find('.mdi-reply').length).to.equal(0);
      expect(element.find('.mdi-reply-all').length).to.equal(1);
    });

    it('should escape HTML in plain text body', function() {
      $scope.email = {
        id: 'id',
        textBody: 'Body <i>with</i> weird <hu>HTML</hu>'
      };
      compileDirective('<email email="email"/>');

      expect(element.find('.email-body').html()).to.contain('Body &lt;i&gt;with&lt;/i&gt; weird &lt;hu&gt;HTML&lt;/hu&gt;');
    });

    it('should autolink links in plain text body', function() {
      $scope.email = {
        id: 'id',
        textBody: 'Body with me@open-paas.org and open-paas.org'
      };
      compileDirective('<email email="email"/>');

      expect(element.find('.email-body a[href="http://open-paas.org"]')).to.have.length(1);
      expect(element.find('.email-body a[href="mailto:me@open-paas.org"]')).to.have.length(1);
    });

    describe('The toggleIsCollapsed function', function() {

      it('should do nothing if email.isCollapsed is not defined', function() {
        var email = {}, spyFn = sinon.spy();

        var element = compileDirective('<email />');
        var scope = element.isolateScope();

        scope.$on('email:collapse', function() {
          spyFn();
        });

        element.controller('email').toggleIsCollapsed(email);

        expect(email.isCollapsed).to.be.undefined;
        expect(spyFn).to.not.have.been.called;
      });

      it('should toggle the email.isCollapsed attribute', function() {
        var email = {
          isCollapsed: true
        };

        compileDirective('<email />').controller('email').toggleIsCollapsed(email);
        expect(email.isCollapsed).to.equal(false);
      });

      it('should broadcast email:collapse event with the email.isCollapsed as data', function(done) {
        var email = {
          isCollapsed: true
        };

        var element = compileDirective('<email />');
        var scope = element.isolateScope();

        // eslint-disable-next-line no-unused-vars
        scope.$on('email:collapse', function(event, data) {
          expect(data).to.equal(false);
          done();
        });

        element.controller('email').toggleIsCollapsed(email);
      });
    });

  });

  describe('The inboxStar directive', function() {

    beforeEach(function() {
      inboxJmapItemService.setFlag = sinon.spy();
    });

    describe('The setIsFlagged function', function() {

      it('should call inboxJmapItemService.setFlag, passing the flag', function() {
        $scope.email = {};

        compileDirective('<inbox-star item="email" />').controller('inboxStar').setIsFlagged(true);

        expect(inboxJmapItemService.setFlag).to.have.been.calledWith($scope.email, 'isFlagged', true);
      });

    });

  });

  describe('The inboxFilterButton directive', function() {
    var scope, controller;

    beforeEach(function() {
      $scope.filters = [
        {id: 'filter_1', displayName: 'display filter 1'},
        {id: 'filter_2', displayName: 'display filter 2'},
        {id: 'filter_3', displayName: 'display filter 3'}
      ];

      element = compileDirective('<inbox-filter-button filters="filters"/>');
      scope = element.isolateScope();
      controller = element.controller('inboxFilterButton');
    });

    it('should init the scope with the required attributes', function() {
      expect(scope.dropdownList).to.deep.equal({
        placeholder: 'Filters',
        filtered: false
      });
    });

    it('should keep the checked filter and indicate set filtered to true', function() {
      $scope.filters = [
        {id: 'filter_1', displayName: 'display filter 1', checked: true},
        {id: 'filter_2', displayName: 'display filter 2'},
        {id: 'filter_3', displayName: 'display filter 3', checked: true}
      ];
      scope = compileDirective('<inbox-filter-button filters="filters"/>').isolateScope();

      expect(scope.dropdownList.filtered).to.be.true;
      expect(_.map($scope.filters, 'checked')).to.deep.equal([true, undefined, true]);
      expect(scope.dropdownList.placeholder).to.equal('2 selected');
    });

    it('should leverage the placeholder attribute as the default placeholder once passed', function() {
      scope = compileDirective('<inbox-filter-button filters="filters" placeholder="my placeholder"/>').isolateScope();

      expect(scope.dropdownList.placeholder).to.equal('my placeholder');
    });

    it('should call the $dropdown service once clicked on mobile', function() {
      element.find('.inbox-filter-button.visible-xs').click();

      expect($dropdown).to.have.been.calledOnce;
    });

    it('should call the $dropdown service once clicked on desktop', function() {
      element.find('.inbox-filter-button.hidden-xs').click();

      expect($dropdown).to.have.been.calledOnce;
    });

    it('should set the dropdownList as filtered when at least one filter is checked', function() {
      scope.filters[0].checked = true;
      controller.dropdownItemClicked();

      expect(scope.dropdownList.filtered).to.be.true;
    });

    it('should set the placeholder to the filter\'s displayName when only one filter is checked', function() {
      scope.filters[0].checked = true;
      controller.dropdownItemClicked();

      expect(scope.dropdownList.placeholder).to.equal('display filter 1');
    });

    it('should set the placeholder to the * selected when several filters are checked', function() {
      scope.filters[0].checked = true;
      scope.filters[1].checked = true;
      controller.dropdownItemClicked();

      expect(scope.dropdownList.placeholder).to.equal('2 selected');
    });

    it('should refresh the dropdown when inbox.filterChanged event is broadcasted', function() {
      scope.filters[0].checked = true;
      scope.filters[1].checked = true;
      $rootScope.$broadcast(INBOX_EVENTS.FILTER_CHANGED);

      expect(scope.dropdownList.placeholder).to.equal('2 selected');
    });

  });

  describe('The composerAttachments directive', function() {
    beforeEach(function() {
      $scope.$updateTitle = angular.noop;
    });

    it('should focus the body when clicked, on desktop', function() {
      compileDirective('<composer-desktop />');

      element.find('.attachments-zone').click();
      $timeout.flush();

      expect(document.activeElement).to.equal(element.find('.note-editable').get(0));
    });

    it('should focus the body when clicked, on mobile', function() {
      isMobile = true;
      compileDirective('<composer />');

      element.find('.attachments-zone').click();
      $timeout.flush();

      expect(document.activeElement).to.equal(element.find('textarea.compose-body').get(0));
    });

    it('should not focus the body when an attachment is removed', function() {
      $scope.email = {
        attachments: [{
          blobId: '1',
          upload: {
            cancel: angular.noop
          }
        }]
      };
      compileDirective('<composer-desktop />');
      $timeout.flush();

      element.find('.attachment[name="attachment-0"] .cancel').click();
      $timeout.flush();

      expect($scope.email.attachments).to.deep.equal([]);
      expect(document.activeElement).to.not.equal(element.find('.note-editable').get(0));
    });

    it('should not focus the body when an attachment upload is retried', function() {
      $scope.email = {
        attachments: [{
          blobId: '1',
          status: 'error',
          upload: {
            cancel: angular.noop
          }
        }]
      };
      compileDirective('<composer-desktop />');

      element.find('.attachment[name="attachment-0"] .retry').click();
      $timeout.flush();

      expect(document.activeElement).to.not.equal(element.find('.note-editable').get(0));
    });

  });

  describe('The inboxEmailFooter directive', function() {

    it('should hide replyAll button if email.hasReplyAll is false', function() {
      $scope.email = { id: 'id', hasReplyAll: false };
      compileDirective('<inbox-email-footer email="email"/>');

      expect(element.find('.mdi-reply-all').length).to.equal(0);
    });

    it('should show replyAll button if email.hasReplyAll is true', function() {
      $scope.email = { id: 'id', hasReplyAll: true };
      compileDirective('<inbox-email-footer email="email"/>');

      expect(element.find('.mdi-reply-all').length).to.equal(1);
    });

    describe('its controller', function() {
      var controller;

      beforeEach(function() {
        $scope.email = { id: 'id' };
        compileDirective('<inbox-email-footer email="email"/>');
        controller = element.controller('inboxEmailFooter');
      });

      it('should expose a "reply" function', function() {
        inboxJmapItemService.reply = sinon.spy();

        controller.reply();

        expect(inboxJmapItemService.reply).to.have.been.calledWith($scope.email);
      });

      it('should expose a "replyAll" function', function() {
        inboxJmapItemService.replyAll = sinon.spy();

        controller.replyAll();

        expect(inboxJmapItemService.replyAll).to.have.been.calledWith($scope.email);
      });

      it('should expose a "forward" function', function() {
        inboxJmapItemService.forward = sinon.spy();

        controller.forward();

        expect(inboxJmapItemService.forward).to.have.been.calledWith($scope.email);
      });
    });

  });

  describe('The inboxEmailer directive', function() {

    var session;

    beforeEach(inject(function(_session_) {
      session = _session_;
    }));

    it('should resolve the emailer', function() {
      $scope.emailer = {
        resolve: sinon.spy()
      };

      compileDirective('<inbox-emailer emailer="emailer"/>');

      expect($scope.emailer.resolve).to.have.been.calledWith();
    });

    it('should resolve the emailer when it becomes available', function() {
      compileDirective('<inbox-emailer emailer="emailer"/>');

      $scope.emailer = {
        resolve: sinon.spy()
      };
      $scope.$digest();

      expect($scope.emailer.resolve).to.have.been.calledWith();
    });

    it('should not display the "me" message when the emailer is me', function() {
      session.user = { preferredEmail: 'me@linagora.com' };
      $scope.emailer = {
        email: 'another-one@linagora.com',
        resolve: angular.noop
      };

      compileDirective('<inbox-emailer emailer="emailer"/>');

      expect(element.find('.me')).to.have.length(0);
    });

    it('should display the "me" message when the emailer is me', function() {
      session.user = { preferredEmail: 'me@linagora.com' };
      $scope.emailer = {
        email: 'me@linagora.com',
        resolve: angular.noop
      };

      compileDirective('<inbox-emailer emailer="emailer"/>');

      expect(element.find('.me')).to.have.length(1);
    });

    it('should not display the email address if hide-email=true', function() {
      $scope.emailer = {
        email: 'me@linagora.com',
        resolve: angular.noop
      };

      compileDirective('<inbox-emailer emailer="emailer" hide-email="true" />');

      expect(element.find('.email')).to.have.length(0);
    });

    it('should display the email address if hide-email=false', function() {
      $scope.emailer = {
        email: 'me@linagora.com',
        resolve: angular.noop
      };

      compileDirective('<inbox-emailer emailer="emailer" hide-email="false" />');

      expect(element.find('.email')).to.have.length(1);
    });

    it('should display the email address if hide-email is not defined', function() {
      $scope.emailer = {
        email: 'me@linagora.com',
        resolve: angular.noop
      };

      compileDirective('<inbox-emailer emailer="emailer" />');

      expect(element.find('.email')).to.have.length(1);
    });

  });

  describe('The inboxEmailerAvatar directive', function() {

    it('should resolve the emailer', function() {
      $scope.emailer = {
        resolve: sinon.spy()
      };

      compileDirective('<inbox-emailer-avatar emailer="emailer"/>');

      expect($scope.emailer.resolve).to.have.been.calledWith();
    });

    it('should resolve the emailer when it becomes available', function() {
      compileDirective('<inbox-emailer-avatar emailer="emailer"/>');

      $scope.emailer = {
        resolve: sinon.spy()
      };
      $scope.$digest();

      expect($scope.emailer.resolve).to.have.been.calledWith();
    });

  });

  describe('The inboxVacationIndicator directive', function() {
    beforeEach(function() {
      notificationFactory.weakSuccess = sinon.spy();
      notificationFactory.weakError = sinon.spy();
      notificationFactory.strongInfo = sinon.spy();
    });

    it('should display the message when vacation is activated', function() {
      jmapClient.getVacationResponse = function() {
        return $q.when({ isActivated: true });
      };

      compileDirective('<inbox-vacation-indicator />');

      expect(element.find('.inbox-vacation-indicator')).to.have.length(1);
    });

    it('should not display the message when vacation is disabled', function() {
      jmapClient.getVacationResponse = function() {
        return $q.when({ isActivated: false });
      };

      compileDirective('<inbox-vacation-indicator />');

      expect(element.find('.inbox-vacation-indicator')).to.have.length(0);
    });

    it('should not display the message when we cannot fetch the vacation status', function() {
      jmapClient.getVacationResponse = function() {
        return $q.reject();
      };

      compileDirective('<inbox-vacation-indicator />');

      expect(element.find('.inbox-vacation-indicator')).to.have.length(0);
    });

    it('should provide a button that removes the message and disables the vacation when clicked', function() {
      var isActivated = true;

      jmapClient.getVacationResponse = function() {
        return $q.when({ isActivated: isActivated });
      };
      jmapClient.setVacationResponse = sinon.spy(function(vacation) {
        expect(vacation).to.shallowDeepEqual({
          isEnabled: false
        });
        isActivated = false;

        return $q.when();
      });

      compileDirective('<inbox-vacation-indicator />').find('.inbox-disable-vacation').click();

      expect(jmapClient.setVacationResponse).to.have.been.calledWith();
      expect(element.find('.inbox-vacation-indicator')).to.have.length(0);
      expect(notificationFactory.weakSuccess).to.have.been.calledWith('', 'Modification of vacation settings succeeded');
    });

    it('should broadcast VACATION_STATUS when vacation is set successfully', function(done) {
      jmapClient.getVacationResponse = function() {
        return $q.when({ isActivated: true });
      };
      jmapClient.setVacationResponse = sinon.spy(function() {
        return $q.when();
      });

      compileDirective('<inbox-vacation-indicator />');

      $rootScope.$on(INBOX_EVENTS.VACATION_STATUS, done.bind(this, null));

      element.find('.inbox-disable-vacation').click();
    });

    it('should listen on VACATION_STATUS to update vacationActivated correspondingly', function() {
      var isActivated = true;

      jmapClient.getVacationResponse = sinon.spy(function() {
        return $q.when({ isActivated: isActivated });
      });

      element = compileDirective('<inbox-vacation-indicator />');

      expect(jmapClient.getVacationResponse).to.have.been.calledOnce;
      $rootScope.$broadcast(INBOX_EVENTS.VACATION_STATUS);

      expect(jmapClient.getVacationResponse).to.have.been.calledTwice;
      expect($rootScope.inbox.vacationActivated).to.equal(isActivated);
    });

    it('should show the message if vacation cannot be disabled', function() {
      jmapClient.getVacationResponse = function() {
        return $q.when({ isActivated: true });
      };
      jmapClient.setVacationResponse = function() {
        return $q.reject();
      };

      compileDirective('<inbox-vacation-indicator />').find('.inbox-disable-vacation').click();

      expect(element.find('.inbox-vacation-indicator')).to.have.length(1);
      expect(notificationFactory.weakError).to.have.been.calledWith('Error', 'Modification of vacation settings failed');
    });

  });

  describe('The inboxClearFiltersButton directive', function() {

    var filters;

    beforeEach(inject(function(inboxFilters) {
      filters = inboxFilters;
    }));

    it('should clear filters when clicked', function() {
      filters[0].checked = true;
      filters[1].checked = true;

      compileDirective('<inbox-clear-filters-button />').children().first().click();

      expect(_.filter(filters, { checked: true })).to.deep.equal([]);
    });

    it('should broadcast inbox.filterChanged when clicked', function(done) {
      $scope.$on(INBOX_EVENTS.FILTER_CHANGED, function() {
        done();
      });

      compileDirective('<inbox-clear-filters-button />').children().first().click();
    });

  });

  describe('The inboxEmptyContainerMessage directive', function() {

    var filters;

    beforeEach(inject(function(inboxFilters) {
      filters = inboxFilters;
    }));

    it('should expose a isFilteringActive function, returning true if at least one filter is checked', function() {
      filters[0].checked = true;

      compileDirective('<inbox-empty-container-message />');

      expect(element.isolateScope().isFilteringActive()).to.equal(true);
    });

    it('should expose a isFilteringActive function, returning false if no filter is checked', function() {
      compileDirective('<inbox-empty-container-message />');

      expect(element.isolateScope().isFilteringActive()).to.equal(false);
    });

    it('should expose a templateUrl from a plugin, if a plugin exist for the current type', function() {
      $stateParams.type = 'myPluginType';
      $templateCache.put('/myPluginTemplate', '');
      inboxPlugins.add({
        type: 'myPluginType',
        getEmptyContextTemplateUrl: _.constant($q.when('/myPluginTemplate'))
      });

      compileDirective('<inbox-empty-container-message />');

      expect(element.isolateScope().containerTemplateUrl).to.equal('/myPluginTemplate');
    });

    it('should expose a templateUrl with a default value if a plugin does not exist for the current type', function() {
      $stateParams.type = 'myPluginType';

      compileDirective('<inbox-empty-container-message />');

      expect(element.isolateScope().containerTemplateUrl).to.equal('/unifiedinbox/views/partials/empty-messages/containers/inbox.html');
    });

  });

  describe('The inboxEmailerDisplay directive', function() {

    var email, _;

    beforeEach(function() {
      email = {
        from: { name: 'Bob', email: 'bob@email', resolve: angular.noop },
        to: [{ name: 'Alice', email: 'alice@email', resolve: angular.noop }],
        cc: [{ name: 'Clark', email: 'clark@email', resolve: angular.noop }],
        bcc: [{ name: 'John', email: 'john@email', resolve: angular.noop }]
      };
    });

    beforeEach(inject(function(___) {
      _ = ___;
    }));

    it('should initialize by exposing scope attributes properly', function() {
      $scope.email = email;
      compileDirective('<inbox-emailer-display email="email" />');

      var isolateScope = element.isolateScope();

      expect(isolateScope.previewEmailer).to.deep.equal(email.to[0]);
      expect(isolateScope.previewEmailerGroup).to.deep.equal('To');
      expect(isolateScope.numberOfHiddenEmailer).to.equal(2);
      expect(isolateScope.showMoreButton).to.equal(true);
    });

    it('should display the first "To" recipient', function() {
      $scope.email = email;

      compileDirective('<inbox-emailer-display email="email" />');

      var isolateScope = element.isolateScope();

      expect(isolateScope.previewEmailer.email).to.deep.equal('alice@email');
      expect(isolateScope.previewEmailerGroup).to.deep.equal('To');
    });

    it('should display the first "CC" recipient', function() {
      $scope.email = _.omit(email, 'to');

      compileDirective('<inbox-emailer-display email="email" />');

      var isolateScope = element.isolateScope();

      expect(isolateScope.previewEmailer.email).to.deep.equal('clark@email');
      expect(isolateScope.previewEmailerGroup).to.deep.equal('CC');
    });

    it('should display the first "BCC" recipient', function() {
      $scope.email = _.omit(email, 'to', 'cc');

      compileDirective('<inbox-emailer-display email="email" />');

      var isolateScope = element.isolateScope();

      expect(isolateScope.previewEmailer.email).to.deep.equal('john@email');
      expect(isolateScope.previewEmailerGroup).to.deep.equal('BCC');
    });

    it('should be collapsed by default', function() {
      $scope.email = email;
      compileDirective('<inbox-emailer-display email="email" />');

      expect(element.find('.recipients .collapsed, .more .collapsed').length).to.equal(2);
      expect(element.find('.recipients .expanded, .more .expanded').length).to.equal(0);
    });

    it('should be expanded after a click on more button then collapsed when click again', function() {
      $scope.email = email;
      compileDirective('<inbox-emailer-display email="email" />');

      element.find('.more').click();

      expect(element.find('.recipients .collapsed, .more .collapsed').length).to.equal(0);
      expect(element.find('.recipients .expanded, .more .expanded').length).to.equal(2);

      element.find('.more').click();

      expect(element.find('.recipients .collapsed, .more .collapsed').length).to.equal(2);
      expect(element.find('.recipients .expanded, .more .expanded').length).to.equal(0);
    });

    it('should not show more button when there is only 1 recipient', function() {
      $scope.email = {
        from: { name: 'Bob', email: 'bob@email', resolve: angular.noop },
        to: [{ name: 'Alice', email: 'alice@email', resolve: angular.noop }],
        cc: []
      };
      compileDirective('<inbox-emailer-display email="email" />');

      expect(element.find('.more').css('display')).to.equal('none');
    });

    it('should show both name and email if there is only 1 recipient and it is not current user', function() {
      $scope.email = {
        from: { name: 'Bob', email: 'bob@email', resolve: angular.noop },
        to: [{ name: 'Alice', email: 'alice@email', resolve: angular.noop }],
        cc: []
      };

      compileDirective('<inbox-emailer-display email="email" />');

      expect(element.find('.to').html()).to.contain(email.to[0].name);
      expect(element.find('.to').html()).to.contain(email.to[0].email);
    });

    it('should not display any recipients if there is no recipients', function() {
      $scope.email = _.omit(email, 'to', 'cc', 'bcc');

      compileDirective('<inbox-emailer-display email="email" />');

      expect(element.find('.recipients .collapsed').length).to.equal(0);
      expect(element.find('.recipients .expanded').length).to.equal(0);
    });

  });

});
