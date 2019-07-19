'use strict';

angular.module('linagora.esn.unifiedinbox')

  .directive('applicationMenuInbox', function(applicationMenuTemplateBuilder, INBOX_MODULE_METADATA) {
    return {
      retrict: 'E',
      replace: true,
      template: applicationMenuTemplateBuilder('/#/unifiedinbox', { url: INBOX_MODULE_METADATA.icon }, 'Inbox', 'core.modules.linagora.esn.unifiedinbox.enabled', INBOX_MODULE_METADATA.isDisplayedByDefault)
    };
  })

  .directive('newComposer', function($timeout, newComposerService) {
    return {
      restrict: 'A',
      link: function(scope, element) {
        element.click(function() {
          newComposerService.open({});
        });
      }
    };
  })

  .directive('opInboxCompose', function($parse, newComposerService, _) {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        function _isEmailDefinedByOpInboxCompose() {
          return attrs.opInboxCompose && attrs.opInboxCompose !== 'op-inbox-compose';
        }

        function _findRecipientEmails() {
          if (_.contains(attrs.ngHref, 'mailto:')) {
            return attrs.ngHref.replace(/^mailto:/, '').split(',');
          }
          if (_isEmailDefinedByOpInboxCompose()) {
            return [attrs.opInboxCompose];
          }
        }

        element.on('click', function(event) {
          var emails = _findRecipientEmails();

          if (emails || attrs.opInboxComposeUsers) {
            event.preventDefault();
            event.stopPropagation();

            var targets;

            if (attrs.opInboxComposeUsers) {
             var users = $parse(attrs.opInboxComposeUsers)(scope);

              targets = users.map(function(target) {
                var targetToAdded = {
                  name: target.name || target.displayName || target.displayName() || target.firstname + ' ' + target.lastname || target.preferredEmail,
                  email: target.email || target.preferredEmail
                };

                return Object.assign(target, targetToAdded);
              });

            } else {
              targets = emails.map(function(email) {
                return {
                  email: email,
                  name: attrs.opInboxComposeDisplayName || email
                };
              });
            }

            newComposerService.open({to: targets});
          }
        });
      }
    };
  })

  .directive('inboxFab', function() {
    return {
      restrict: 'E',
      templateUrl: '/unifiedinbox/views/partials/inbox-fab.html',
      link: function(scope, element) {

        function findButton() {
          return element.children('button').first();
        }

        function disableFab() {
          findButton().removeClass('btn-accent');
          scope.isDisabled = true;
        }

        function enableFab() {
          findButton().addClass('btn-accent');
          scope.isDisabled = false;
        }

        scope.$on('box-overlay:no-space-left-on-screen', function() {
          disableFab();
        });

        scope.$on('box-overlay:space-left-on-screen', function() {
          enableFab();
        });
      }
    };
  })

  .directive('mailboxDisplay', function(MAILBOX_ROLE_ICONS_MAPPING, inboxJmapItemService, inboxMailboxesService, _, $rootScope, INBOX_EVENTS) {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        mailbox: '=',
        hideBadge: '@',
        hideAside: '&',
        isSpecial: '=?',
        isSystem: '=?',
        isFolder: '=?',
        isShared: '=?'
      },
      templateUrl: '/unifiedinbox/views/sidebar/email/menu-item.html',
      link: function(scope) {
        scope.mailboxIcons = MAILBOX_ROLE_ICONS_MAPPING[scope.mailbox.role.value || 'default'] || scope.mailbox.icon;

        $rootScope.$on(INBOX_EVENTS.BADGE_LOADING_ACTIVATED, function(evt, data) {
          scope.badgeLoadingActivated = data;
        });

        scope.onDrop = function($dragData) {
          return inboxJmapItemService.moveMultipleItems($dragData, scope.mailbox);
        };

        scope.isDropZone = function($dragData) {
          return _.all($dragData, function(item) {
            return inboxMailboxesService.canMoveMessage(item, scope.mailbox);
          });
        };
      }
    };
  })

  .directive('inboxEmailer', function(session) {
    return {
      restrict: 'E',
      replace: true,
      controller: 'resolveEmailerController',
      scope: {
        emailer: '=',
        hideEmail: '=?',
        highlight: '@?'
      },
      templateUrl: '/unifiedinbox/views/partials/emailer/inbox-emailer.html',
      link: function(scope) {
        scope.$watch('emailer', function(emailer) {
          scope.me = emailer && emailer.email && emailer.email === session.user.preferredEmail;
        });
      }
    };
  })

  .directive('inboxEmailerAvatar', function() {
    return {
      restrict: 'E',
      controller: 'resolveEmailerController',
      controllerAs: '$ctrl',
      scope: {
        emailer: '='
      },
      templateUrl: '/unifiedinbox/views/partials/emailer/inbox-emailer-avatar.html'
    };
  })

  .directive('inboxEmailerAvatarPopover', function() {
    return {
      restrict: 'E',
      controller: 'resolveEmailerController',
      controllerAs: '$ctrl',
      scope: {
        emailer: '='
      },
      templateUrl: '/unifiedinbox/views/partials/emailer/inbox-emailer-avatar-popover.html'
    };
  })

  .directive('inboxEmailerGroup', function() {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        group: '=',
        displayInline: '@?'
      },
      templateUrl: '/unifiedinbox/views/partials/emailer/inbox-emailer-group.html'
    };
  })

  .directive('inboxEmailerDisplay', function(emailSendingService, _) {
    function link(scope) {
      var groupLabels = { to: 'To', cc: 'CC', bcc: 'BCC'},
          groups = _.keys(groupLabels);

      _init();

      function findAndAssignPreviewEmailer(find) {
        for (var i = 0; i < groups.length; i++) {
          var group = groups[i],
              emailer = find(scope.email[group]);

          if (emailer) {
            scope.previewEmailer = emailer;
            scope.previewEmailerGroup = groupLabels[group];

            break;
          }
        }
      }

      function _init() {
        findAndAssignPreviewEmailer(_.head);

        scope.collapsed = true;
        scope.numberOfHiddenEmailer = emailSendingService.countRecipients(scope.email) - 1;
        scope.showMoreButton = scope.numberOfHiddenEmailer > 0;
      }
    }

    return {
      restrict: 'E',
      scope: {
        email: '='
      },
      templateUrl: '/unifiedinbox/views/partials/emailer/inbox-emailer-display.html',
      link: link
    };
  })

  .directive('attachmentDownloadAction', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/unifiedinbox/views/attachment/attachment-download-action.html'
    };
  })

  .directive('inboxAttachment', function() {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        attachment: '='
      },
      controller: 'attachmentController',
      controllerAs: 'ctrl',
      templateUrl: '/unifiedinbox/views/attachment/inbox-attachment.html'
    };
  })

  .directive('recipientsAutoComplete', function(_, elementScrollService, searchService, emailService) {
    return {
      restrict: 'E',
      scope: {
        tags: '=ngModel',
        excludedEmails: '=',
        addClass: '=?'
      },
      templateUrl: '/unifiedinbox/views/composer/recipients-auto-complete.html',
      link: function(scope, element) {

        function normalizeToEMailer(tag) {
          Object.keys(tag).forEach(function(key) {

            if (!tag.email) {
              if (key === 'name') {
                var foundTags = [];

                tag.name = tag.name.replace(/(.*?)<(.*?)>/g, function(match, name, email) {
                  name = name.trim();
                  email = email.trim();

                  if (!name.length) {
                    name = email;
                  }

                  foundTags.push({ name: name, email: email });

                  return '';
                });

                /*The replace will match every "name <email>" or "<email>", and will push all in the foundTags array.

                But we don't want add the last match if anything left in tag.name,
                so that ngTagsInput internal logic appends the last tag automatically.

                If there's some charaters left in tag.name, this will be added as a tag also. */

                if (!tag.name) {
                  var lastTag = foundTags.pop();

                  tag.email = lastTag.email;
                  tag.name = lastTag.name;
                }

                foundTags.forEach(function(newTag) {
                  scope.tags.push(newTag);
                });
              }
            }

          });

          if (!tag.email) {
            tag.name = tag.name.trim();
            tag.email = tag.name;
          } else if (!tag.name || (tag.name && !tag.name.trim())) {
              tag.name = tag.email;
          }
        }

        scope.tags = scope.tags || [];
        scope.excludes = scope.tags.map(function(tag) {
          if (tag.id && tag.objectType) {
            return {
              id: tag.id,
              objectType: tag.objectType
            };
          }
        }).filter(Boolean);

        scope.tags
          .filter(function(tag) { return tag.email; })
          .forEach(normalizeToEMailer);

        scope.search = function(query) {
          return searchService.searchRecipients(query, scope.excludes);
        };

        scope.onTagAdding = function($tag) {
          normalizeToEMailer($tag);

          if (!emailService.isValidEmail($tag.email)) {
            return false;
          }

          if (scope.excludedEmails && scope.excludedEmails.indexOf($tag.email) > -1) {
            return false;
          }

          return !_.find(scope.tags, { email: $tag.email });
        };

        scope.onTagAdded = function($tag) {
          if ($tag.id && $tag.objectType) {
            scope.excludes.push({
              id: $tag.id,
              objectType: $tag.objectType
            });
          }

          elementScrollService.autoScrollDown(element.find('div.tags'));
        };

        scope.onTagRemoved = function($tag) {
          _.remove(scope.excludes, function(exclude) {
            return exclude.id === $tag.id;
          });
        };
      }
    };
  })

  .directive('emailBodyEditor', function(emailBodyService) {
    function template(name) {
      return '/unifiedinbox/views/composer/editor/' + name + '.html';
    }

    return {
      restrict: 'E',
      templateUrl: function() {
        return emailBodyService.supportsRichtext() ? template('richtext') : template('plaintext');
      }
    };
  })

  .directive('inboxStar', function(inboxJmapItemService) {
    return {
      restrict: 'E',
      controller: function($scope) {
        this.setIsFlagged = function(state) {
          inboxJmapItemService.setFlag($scope.item, 'isFlagged', state);
        };
      },
      controllerAs: 'ctrl',
      scope: {
        item: '='
      },
      templateUrl: '/unifiedinbox/views/partials/inbox-star.html'
    };
  })

  .directive('email', function(inboxJmapItemService, navigateTo) {
    return {
      restrict: 'E',
      controller: function($scope) {
        ['reply', 'replyAll', 'forward'].forEach(function(action) {
          this[action] = function() {
            inboxJmapItemService[action]($scope.email);
          };
        }.bind(this));

        this.toggleIsCollapsed = function(email) {
          if (angular.isDefined(email.isCollapsed)) {
            email.isCollapsed = !email.isCollapsed;
            $scope.$broadcast('email:collapse', email.isCollapsed);
          }
        };

        this.download = function() {
          inboxJmapItemService.downloadEML($scope.email).then(navigateTo);
        };
      },
      controllerAs: 'ctrl',
      scope: {
        email: '='
      },
      templateUrl: '/unifiedinbox/views/partials/email.html'
    };
  })

  .directive('inboxIndicators', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/unifiedinbox/views/partials/inbox-indicators.html',
      scope: {
        item: '=',
        hiddenXl: '@'
      }
    };
  })

  .directive('inboxEmailFooter', function(inboxJmapItemService) {
    return {
      restrict: 'E',
      templateUrl: '/unifiedinbox/views/partials/email-footer.html',
      scope: {
        email: '='
      },
      controller: function($scope, esnShortcuts, INBOX_SHORTCUTS_ACTIONS_CATEGORY) {
        ['reply', 'replyAll', 'forward'].forEach(function(action) {
          this[action] = function() {
            inboxJmapItemService[action]($scope.email);
          };
        }.bind(this));

        esnShortcuts.use(INBOX_SHORTCUTS_ACTIONS_CATEGORY.shortcuts.REPLY_EMAIL, this.reply, $scope);
        esnShortcuts.use(INBOX_SHORTCUTS_ACTIONS_CATEGORY.shortcuts.REPLY_ALL_EMAIL, this.replyAll, $scope);
        esnShortcuts.use(INBOX_SHORTCUTS_ACTIONS_CATEGORY.shortcuts.FORWARD_EMAIL, this.forward, $scope);
      },
      controllerAs: 'ctrl'
    };
  })

  .directive('inboxFilterButton', function($rootScope, _, esnI18nService, INBOX_EVENTS) {
    return {
      restrict: 'E',
      templateUrl: '/unifiedinbox/views/filter/filter-button.html',
      scope: {
        filters: '=',
        placeholder: '@'
      },
      controllerAs: 'ctrl',
      controller: function($scope) {
        var defaultPlaceholder = $scope.placeholder || 'Filters';

        function updateDropdownList() {
          var checkedItems = _.filter($scope.filters, { checked: true });
          var numberFilterSelected = esnI18nService.translate('%s selected', checkedItems.length).toString();

          if (checkedItems.length > 0) {
            $scope.dropdownList.filtered = true;
            $scope.dropdownList.placeholder = (checkedItems.length === 1) ? checkedItems[0].displayName : numberFilterSelected;
          } else {
            $scope.dropdownList.filtered = false;
            $scope.dropdownList.placeholder = defaultPlaceholder;
          }
        }

        $scope.dropdownList = {};
        $scope.$on(INBOX_EVENTS.FILTER_CHANGED, updateDropdownList);

        this.dropdownItemClicked = function() {
          updateDropdownList();

          $rootScope.$broadcast(INBOX_EVENTS.FILTER_CHANGED);
        };

        // Define proper initial state of the button
        updateDropdownList();
      }
    };
  })

  .directive('inboxEmptyContainerMessage', function($stateParams, inboxFilteringService, inboxPlugins) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: '/unifiedinbox/views/partials/empty-messages/index.html',
      link: function(scope) {
        var plugin = inboxPlugins.get($stateParams.type);

        scope.isFilteringActive = inboxFilteringService.isFilteringActive;

        if (plugin) {
          plugin.getEmptyContextTemplateUrl($stateParams.account, $stateParams.context).then(function(templateUrl) {
            scope.containerTemplateUrl = templateUrl;
          });
        } else {
          scope.containerTemplateUrl = '/unifiedinbox/views/partials/empty-messages/containers/inbox.html';
        }
      }
    };
  })

  .directive('inboxClearFiltersButton', function(inboxFilteringService) {
    return {
      restrict: 'E',
      scope: {},
      controller: function() {
        this.clearFilters = function() {
          inboxFilteringService.clearFilters();
        };
      },
      controllerAs: 'ctrl',
      templateUrl: '/unifiedinbox/views/filter/inbox-clear-filters-button.html'
    };
  })

  .directive('inboxHomeButton', function() {
    return {
      restrict: 'E',
      templateUrl: '/unifiedinbox/views/partials/inbox-home-button.html'
    };
  })

  .directive('inboxListAccountUnavailable', function() {
    return {
      restrict: 'E',
      scope: {
        account: '='
      },
      templateUrl: '/unifiedinbox/views/partials/empty-messages/inbox-list-account-unavailable.html'
    };
  });
