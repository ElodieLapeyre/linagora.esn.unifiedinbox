(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')
    .controller('inboxIdentityCreateController', inboxIdentityCreateController);

  function inboxIdentityCreateController(
    $rootScope,
    asyncAction,
    user,
    inboxIdentitiesService,
    INBOX_IDENTITIES_EVENTS
  ) {
    var self = this;

    self.init = init;
    self.onCreateBtnClick = onCreateBtnClick;

    function init() {
      self.identity = {};
    }

    function onCreateBtnClick() {
      return asyncAction({
        progressing: 'Creating identity...',
        success: 'Identity created',
        failure: 'Failed to create identity'
      }, function() {
        return _storeIdentity();
      });
    }

    function _storeIdentity() {
      return inboxIdentitiesService.storeIdentity(self.identity, user._id)
        .then(updatedIdentities => {
          $rootScope.$broadcast(INBOX_IDENTITIES_EVENTS.UPDATED, updatedIdentities);
        });
    }
  }
})(angular);
