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
  'components/attachment-alternative-uploader/attachment-alternative-uploader-modal.controller.js',
  'components/attachment-alternative-uploader/attachment-alternative-uploader-modal.service.js',
  'services/mailboxes/permissions-service.constants.js',
  'services/mailboxes/permissions-service.js',
  'services/mailboxes/shared-mailboxes.constants.js',
  'services/mailboxes/shared-mailboxes.js',
  'services/mailboxes/mailboxes-service.js',
  'services/attachment-upload/inbox-attachment-upload.service.js',
  'services/attachment-provider-registry/attachment-provider-registry.service.js',
  'services/attachment-jmap/attachment-jmap.constants.js',
  'services/attachment-jmap/attachment-jmap.run.js',
  'services/attachment-jmap/attachment-jmap.service.js',
  'components/list/group-toggle-selection/list-group-toggle-selection.js',
  'components/list/group-toggle-selection/list-group-toggle-selection.controller.js',
  'components/subheader/more-button/subheader-more-button.js',
  'components/subheader/delete-button/subheader-delete-button.js',
  'components/subheader/mark-as-read-button/subheader-mark-as-read-button.js',
  'components/subheader/mark-as-unread-button/subheader-mark-as-unread-button.js',
  'services/models/emailer.run.js',
  'services/models/mailbox.run.js',
  'filters/filter-descendant-mailboxes.js',
  'filters/visible-shared-mailboxes.js',
  'services/models/make-selectable.js',
  'services/models/message.run.js',
  'services/models/thread.run.js',
  'services/plugins/plugins.js',
  'services/plugins/jmap/jmap-plugin.run.js',
  'services/filtered-list/filtered-list.js',
  'services/hook/email-sending-hook.service.js',
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
  'services/filtering/filters.js',
  'services/shortcuts/shortcuts.run.js',
  'services/shortcuts/shortcuts.constants.js',
  'components/sidebar/folder-settings/folder-settings.component.js',
  'components/sidebar/folder-settings/folder-settings.controller.js',
  'components/mailbox-shared-settings/mailbox-shared-settings.component.js',
  'components/mailbox-shared-settings/mailbox-shared-settings.controller.js',
  'components/mailbox-shared-settings/user/mailbox-shared-settings-user.component.js',
  'components/mailbox-shared-settings/owner/mailbox-shared-settings-owner.component.js',
  'components/shared-mailboxes/shared-mailboxes.component.js',
  'components/shared-mailboxes/shared-mailboxes.controller.js',
  'components/shared-mailboxes/subheader/shared-mailboxes-subheader.js',
  'components/shared-mailboxes/shared-mailbox/shared-mailbox.component.js',
  'services/config/config.js',
  'services/email-body/email-body.js',
  'services/generate-jwt-token/generate-jwt-token.js',
  'services/jmap-client-provider/jmap-client-provider.js',
  'services/local-timezone/local-timezone.js',
  'services/new-composer/new-composer.js',
  'services/with-jmap-client/with-jmap-client.js',
  'components/preferences/general/inbox-preferences-mailto.js',
  'components/preferences/general/inbox-preferences-mailto.controller.js',
  'components/preferences/general/inbox-preferences-mailto.run.js'
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

const mailtoCoreAngularModules = [
  'esn.jmap-client-wrapper',
  'esn.notification',
  'esn.file',
  'esn.box-overlay',
  'esn.profile',
  'esn.summernote-wrapper',
  'esn.attendee',
  'esn.scroll',
  'esn.offline-wrapper',
  'esn.lodash-wrapper',
  'esn.desktop-utils',
  'esn.form.helper',
  'esn.url',
  'esn.background',
  'esn.configuration',
  'esn.core',
  'esn.async-action',
  'esn.user',
  'esn.session',
  'esn.registry',
  'esn.module-registry',
  'esn.user-configuration',
  'esn.datetime',
  'esn.i18n',
  'esn.http',
  'esn.promise',
  'esn.object-type',
  'esn.domain',
  'esn.feature-registry',
  'esn.email-addresses-wrapper',
  'esn.escape-html'
];

const mailtoAngularJsFiles = [
  'constants.js',
  'services.js',
  'controllers.js',
  'directives/main.js'
];

const mailtoInboxAngularAppFiles = [
  'mailto/mailto.js',
  'mailto/mailto.mocks.js',
  'mailto/mailto.constants.js',
  'mailto/mailto.config.js',
  'mailto/mailto.run.js',
  'services/config/config.js',
  'services/new-composer/new-composer.js',
  'services/jmap-helper/jmap-helper.js',
  'services/email-body/email-body.js',
  'services/local-timezone/local-timezone.js',
  'services/with-jmap-client/with-jmap-client.js',
  'services/jmap-client-provider/jmap-client-provider.js',
  'services/generate-jwt-token/generate-jwt-token.js',
  'services/identities/identities-service.js',
  'services/mailboxes/mailboxes-service.js',
  'services/mailboxes/shared-mailboxes.js',
  'services/mailboxes/shared-mailboxes.constants.js',
  'services/mailboxes/special-mailboxes.js',
  'services/mailto-parser/mailto-parser.js'
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
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.assets', 'assets'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.graceperiod', 'graceperiod')
  ],
  states: {
    lib: function(dependencies, callback) {
      var inbox = require('./backend/webserver/api')(dependencies);

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
      ], ['esn']);

      webserverWrapper.addApp('unifiedinbox', app);

      webserverWrapper.requestCoreFrontendInjections('mailto', mailtoCoreAngularModules);
      webserverWrapper.injectAngularModules('unifiedinbox', mailtoAngularJsFiles, 'linagora.esn.unifiedinbox.mailto', ['mailto'], {
        localJsFiles: mailtoAngularJsFiles.map(file => path.join(FRONTEND_JS_PATH, 'js', file))
      });
      webserverWrapper.injectAngularAppModules('unifiedinbox', mailtoInboxAngularAppFiles, 'linagora.esn.unifiedinbox.mailto', ['mailto'], {
        localJsFiles: mailtoInboxAngularAppFiles.map(file => path.join(FRONTEND_JS_PATH, 'app', file))
      });

      require('./backend/lib/config')(dependencies).register();

      return callback();
    },

    start: (dependencies, callback) => callback()
  }
});

module.exports = unifiedInboxModule;
