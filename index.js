'use strict';

var AwesomeModule = require('awesome-module');
var Dependency = AwesomeModule.AwesomeModuleDependency;
var path = require('path');

const angularAppFiles = [
  'components/sidebar/attachment/sidebar-attachment.component.js',
  'components/sidebar/attachment/sidebar-attachment.controller.js',
  'components/sidebar/attachment-button/sidebar-attachment-button.component.js',
  'components/message-body/message-body.js',
  'components/message-body/html/message-body-html.js',
  'components/message-body/html/message-body-html.controller.js',
  'components/message-body/text/message-body-text.js',
  'services/mailboxes/mailboxes-service.js',
  'components/list/group-toggle-selection/list-group-toggle-selection.js',
  'components/list/group-toggle-selection/list-group-toggle-selection.controller.js',
  'components/subheader/more-button/subheader-more-button.js',
  'components/subheader/delete-button/subheader-delete-button.js',
  'components/subheader/mark-as-read-button/subheader-mark-as-read-button.js',
  'components/subheader/mark-as-unread-button/subheader-mark-as-unread-button.js',
  'services/models/emailer.run.js',
  'services/models/mailbox.run.js',
  'filters/filter-descendant-mailboxes.js',
  'services/models/make-selectable.js',
  'services/models/message.run.js',
  'services/models/thread.run.js',
  'services/plugins/plugins.js',
  'services/plugins/jmap/jmap-plugin.run.js',
  'services/filtered-list/filtered-list.js',
  'components/identities/identities.js',
  'components/identities/identities.controller.js',
  'components/identities/subheader/identities-subheader.js',
  'components/identity/identity.js',
  'components/identity/identity.controller.js',
  'components/identity/form/identity-form.js',
  'components/identity/form/identity-form.controller.js',
  'components/identity/form/subheader/identity-form-subheader.js',
  'components/config/inbox-config-form.component.js',
  'services/identities/identities-service.js',
  'services/jmap-helper/jmap-helper.js',
  'filters/quote/quote.js',
  'services/jmap-item/jmap-item-service.js',
  'components/filter-input/filter-input.js',
  'components/filter-input/filter-input.controller.js',
  'services/mailboxes/special-mailboxes.js',
  'services/mailboxes/special-mailboxes.constants.js',
  'services/mailboxes/special-mailboxes.run.js',
  'components/list/header/list-header.js',
  'components/list/header/list-header.controller.js',
  'services/date-groups/date-groups.js',
  'filters/item-date.js',
  'services/filtering/filtering-service.js',
  'services/filtering/filters.js'
];

const angularJsFiles = [
  'app.js',
  'constants.js',
  'controllers.js',
  'services.js',
  'filters.js',
  'providers.js',
  'directives/main.js',
  'directives/subheaders.js',
  'directives/lists.js',
  'directives/sidebar.js'
];

const FRONTEND_JS_PATH = path.join(__dirname, 'frontend');

var unifiedInboxModule = new AwesomeModule('linagora.esn.unifiedinbox', {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.logger', 'logger'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.esn-config', 'esn-config'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.email', 'email'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.i18n', 'i18n'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.middleware.authorization', 'authorizationMW'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.graceperiod', 'graceperiod')
  ],
  states: {
    lib: function(dependencies, callback) {
      var inbox = require('./backend/webserver/api/inbox/router')(dependencies);

      var lib = {
        api: {
          inbox: inbox
        }
      };

      return callback(null, lib);
    },

    deploy: function(dependencies, callback) {
      var app = require('./backend/webserver/application')(dependencies),
          webserverWrapper = dependencies('webserver-wrapper');

      webserverWrapper.injectAngularModules('unifiedinbox', angularJsFiles, 'linagora.esn.unifiedinbox', ['esn'], {
        localJsFiles: angularJsFiles.map(file => path.join(FRONTEND_JS_PATH, 'js', file))
      });

      webserverWrapper.injectAngularAppModules('unifiedinbox', angularAppFiles, 'linagora.esn.unifiedinbox', ['esn'], {
        localJsFiles: angularAppFiles.map(file => path.join(FRONTEND_JS_PATH, 'app', file))
      });

      webserverWrapper.injectLess('unifiedinbox', [
        path.resolve(__dirname, './frontend/app/inbox.less')
      ], 'esn');

      webserverWrapper.addApp('unifiedinbox', app);

      require('./backend/lib/config')(dependencies).register();

      return callback();
    },

    start: (dependencies, callback) => callback()
  }
});

module.exports = unifiedInboxModule;
