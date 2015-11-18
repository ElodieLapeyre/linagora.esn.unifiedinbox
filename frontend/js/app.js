'use strict';

angular.module('linagora.esn.unifiedinbox', [
  'esn.jmap-client-wrapper',
  'angularMoment',
  'esn.notification',
  'esn.iframe-resizer-wrapper',
  'esn.file',
  'esn.box-overlay',
  'esn.profile',
  'esn.summernote-wrapper',
  'esn.attendee',
  'esn.fullscreen-edit-form',
  'esn.scroll',
  'op.dynamicDirective'
  ])
  .config(function($routeProvider, dynamicDirectiveServiceProvider) {
    $routeProvider.when('/unifiedinbox', {
      templateUrl: '/unifiedinbox/views/unifiedinbox'
    });
    $routeProvider.when('/unifiedinbox/:mailbox', {
      templateUrl: '/unifiedinbox/views/listEmails',
      controller: 'listEmailsController'
    });
    $routeProvider.when('/unifiedinbox/:mailbox/:emailId', {
      templateUrl: '/unifiedinbox/views/viewEmail',
      controller: 'viewEmailController'
    });

    var sidebarDirective = new dynamicDirectiveServiceProvider.DynamicDirective(true, 'inbox-menu', {priority: -150});
    dynamicDirectiveServiceProvider.addInjection('esn-sidebar-app-menu', sidebarDirective);
  });
