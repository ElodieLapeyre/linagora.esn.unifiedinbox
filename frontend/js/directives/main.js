'use strict';

angular.module('linagora.esn.unifiedinbox')

  .directive('applicationMenuInbox', function(applicationMenuTemplateBuilder, INBOX_MODULE_METADATA) {
    return {
      retrict: 'E',
      replace: true,
      template: applicationMenuTemplateBuilder('/#/unifiedinbox', { url: INBOX_MODULE_METADATA.icon }, 'Inbox')
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

  .directive('opInboxCompose', function(newComposerService, _) {
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

          if (emails) {
            event.preventDefault();
            event.stopPropagation();

            newComposerService.open({
              to: emails.map(function(email) {
                return {
                  email: email,
                  name: attrs.opInboxComposeDisplayName || email
                };
              })
            });
          }
        });
      }
    };
  })

  .directive('inboxFab', function($timeout, boxOverlayService) {
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

        $timeout(function() {
          if (!boxOverlayService.spaceLeftOnScreen()) {
            disableFab();
          } else {
            enableFab();
          }
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
        settings: '=',
        hideAside: '&',
        shared: '='
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
      scope: {
        emailer: '='
      },
      templateUrl: '/unifiedinbox/views/partials/emailer/inbox-emailer-avatar.html'
    };
  })

  .directive('inboxEmailerGroup', function() {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        group: '='
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

  .directive('composer', function($rootScope, $state, $timeout, elementScrollService, emailBodyService, autosize,
                                  esnPreviousPage, INBOX_SIGNATURE_SEPARATOR) {
    return {
      restrict: 'E',
      templateUrl: '/unifiedinbox/views/composer/composer.html',
      controller: 'composerController',
      controllerAs: 'ctrl',
      link: function(scope, element, attrs, controller) {
        scope.isBoxed = function() {return false;};

        var disableOnBackAutoSave = $rootScope.$on('$stateChangeSuccess', function(event, toState) {
          if (toState && toState.data && toState.data.ignoreSaveAsDraft) {
            return disableOnBackAutoSave();
          }

          quitAsSaveDraft();
        });

        scope.hide = quit.bind(null, backToLastLocation);
        scope.close = quitAsSaveDraft;

        scope.editQuotedMail = function() {
          var emailBody = element.find('.compose-body'),
              typedTextLength = (scope.email.textBody || '').length;

          return emailBodyService.quote(scope.email, scope.email.quoteTemplate)
            .then(function(body) {
              var needToBeSaved = controller.getComposition().draft.needToBeSaved(scope.email);

              scope.email.isQuoting = true;
              scope.email.textBody = body;

              if (!needToBeSaved) {
                controller.initCtrl(scope.email);
              }
            })
            .then(function() {
              $timeout(function() {
                emailBody.focusBegin(typedTextLength);
                autosize.update(emailBody.get(0));

                elementScrollService.scrollDownToElement(emailBody);
              }, 0);
            });
        };

        scope.focusEmailBody = function() {
          $timeout(function() {
            element.find('.compose-body').focusEnd();
          }, 0);
        };

        scope.updateIdentity = function() {
          var text = scope.email.textBody || '',
              identity = scope.email.identity,
              startOfSignature = new RegExp('^' + INBOX_SIGNATURE_SEPARATOR, 'm').exec(text),
              /* eslint-disable no-control-regex */ startOfQuote = /^\x00/m.exec(text),
              newText = '';

          // The code currently only supports placing the signature before the quote, this will be improved
          // when we later implement the option to place it after the quote.
          //
          // Positioning is as follows:
          //
          // TEXT
          // --             <- This symbol is the delimiter of the signature: "-- \n"
          // SIGNATURE
          //
          // [MARKER]QUOTE  <- The MARKER is a NULL character: "\x00"
          // > QUOTED TEXT
          //
          if (startOfSignature) {
            newText = text.substring(0, startOfSignature.index);
          } else if (startOfQuote) {
            newText = text.substring(0, startOfQuote.index);
          } else {
            newText = text;
          }

          if (identity.textSignature) {
            // If signature is at the top of the message, add a blank line so that it's easier to enter text before
            if (!newText) {
              newText += '\n\n';
            }

            newText += controller.getIdentitySignature(identity) + '\n\n';
          }

          if (startOfQuote) {
            newText += text.substring(startOfQuote.index);
          }

          scope.email.textBody = newText;

          $timeout(function() {
            autosize.update(element.find('.compose-body').get(0));
          }, 0, false);
        };

        scope.openRecipients = function(recipientsType) {
          $state.go('.recipients', {
            recipientsType: recipientsType,
            composition: controller.getComposition()
          }, { location: 'replace' });
        };

        function backToLastLocation() {
          esnPreviousPage.back('unifiedinbox');
        }

        function quit(action) {
          disableOnBackAutoSave();

          if (action) {
            action();
          }
        }

        function quitAsSaveDraft() {
          quit(controller.saveDraft);
        }

      }
    };
  })

  .directive('composerAttachments', function() {
    return {
      restrict: 'AE',
      scope: true,
      templateUrl: '/unifiedinbox/views/attachment/composer-attachments.html'
    };
  })

  .directive('composerDesktop', function($rootScope, $timeout, $compile, KEYCODES, ESN_BOX_OVERLAY_EVENTS) {
    return {
      restrict: 'E',
      templateUrl: '/unifiedinbox/views/composer/composer-desktop.html',
      controller: 'composerController',
      controllerAs: 'ctrl',
      link: function(scope, element, attrs, controller) {
        scope.email && scope.$updateTitle(scope.email.subject);

        scope.isBoxed = function() {return true;};

        function focusOnRightField(email) {
          $timeout(function() {
            if (!email || !email.to || email.to.length === 0) {
              element.find('.recipients-to input').focus();
            } else {
              element.find('.summernote').summernote('focus');
            }
          }, 0);
        }

        function focusOnResize() {
          if (scope.lastFocused && scope.lastFocused.node) {
            if (!!scope.lastFocused.isFoldable && scope.isCollapsed) {
              scope.isCollapsed = false;
            }
            $timeout(function() { scope.lastFocused.node.focus(); }, 350);
          }
        }

        function _getEventKey(event) {
          return event.which || event.keyCode;
        }

        function isRecipient(inputElement) {
          return angular.element(inputElement).closest('recipients-auto-complete').length > 0;
        }

        function handleFocusEvent(event) {
          scope.lastFocused = {
            node: event.target,
            isFoldable: isRecipient(event.target) && !scope.isCollapsed
          };
        }

        function startTrackingFocus(element) {
          element.context.children[0].addEventListener('focusin', handleFocusEvent, true);
        }

        scope.onInit = function(event) {
          startTrackingFocus(element);
          focusOnRightField(scope.email);

          element
            .find('.note-editable')
            .keydown(function(event) {
              if (_getEventKey(event) === KEYCODES.TAB_KEY && event.shiftKey) {
                element.find('.compose-subject').focus();
                event.preventDefault();
              }
            })
            .after($compile('<composer-attachments></composer-attachments>')(scope));

          element
            .find('.compose-subject')
            .keydown(function(event) {
              if (_getEventKey(event) === KEYCODES.TAB_KEY && !event.shiftKey) {
                scope.focusEmailBody();
                event.preventDefault();
              }
            });

          scope.unsubFocus = scope.$on(ESN_BOX_OVERLAY_EVENTS.RESIZED, focusOnResize);

          // We initialize our Composition instance with the summernote representation of the body
          // which allows us to later compare it with the current body, to detect user changes.
          scope.email.htmlBody = event.note.summernote('code');
          $timeout(function() {
            controller.initCtrl(scope.email, scope.compositionOptions);
          }, 0);
        };

        scope.focusEmailBody = function() {
          $timeout(function() {
            // `focusEnd` does not explicitely call `focus` so the contentEditable is not focused on Firefox
            // while it works fine on Chrome. thus the double `focus` call.
            element.find('.summernote').summernote('focus');
            element.find('.note-editable').focusEnd();
          }, 0);
        };

        scope.updateIdentity = function() {
          var identity = scope.email.identity,
              editable = element.find('.note-editable'),
              signatureElement = editable.find('> pre.openpaas-signature'),
              citeElement = editable.find('> cite');

          if (identity.textSignature) {
            if (!signatureElement.length) {
              signatureElement = angular.element('<pre class="openpaas-signature"></pre>');

              if (citeElement.length) {
                signatureElement.insertBefore(citeElement.get(0));
              } else {
                signatureElement.appendTo(editable);
              }
            }

            signatureElement.text(controller.getIdentitySignature(identity));
          } else {
            signatureElement.remove();
          }

          scope.email.htmlBody = element.find('.summernote').summernote('code');
        };

        scope.hide = scope.$hide;
        scope.$on('$destroy', function() {
          scope.unsubFocus && scope.unsubFocus();
          controller.saveDraft();
        });
      }
    };
  })

  .directive('recipientsAutoComplete', function($rootScope, emailSendingService, elementScrollService, searchService, _) {
    return {
      restrict: 'E',
      scope: {
        tags: '=ngModel'
      },
      templateUrl: function(elem, attr) {
        if (!attr.template) {
          throw new Error('This directive requires a template attribute');
        }

        return '/unifiedinbox/views/composer/' + attr.template + '.html';
      },
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

            if (key !== 'email' && key !== 'name') {
              delete tag[key];
            }
          });

          if (!tag.email) {
            tag.name = tag.name.trim();
            tag.email = tag.name;
          }
        }

        scope.tags = scope.tags || [];
        scope.search = searchService.searchRecipients;

        scope.onTagAdding = function($tag) {
          normalizeToEMailer($tag);

          return !_.find(scope.tags, { email: $tag.email });
        };
        scope.onTagAdded = function() {
          elementScrollService.autoScrollDown(element.find('div.tags'));
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
        item: '='
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

  .directive('inboxFilterButton', function($rootScope, _, INBOX_EVENTS) {
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

          if (checkedItems.length > 0) {
            $scope.dropdownList.filtered = true;
            $scope.dropdownList.placeholder = (checkedItems.length === 1) ? checkedItems[0].displayName : checkedItems.length + ' selected';
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

  .directive('inboxVacationIndicator', function($rootScope, withJmapClient, asyncJmapAction, jmap, INBOX_EVENTS) {
    return {
      restrict: 'E',
      scope: true,
      controller: function($scope) {
        function _updateVacationStatus() {
          withJmapClient(function(client) {
            client.getVacationResponse().then(function(vacation) {
              $rootScope.inbox.vacationActivated = vacation.isActivated;
            });
          });
        }

        this.disableVacation = function() {
          $rootScope.inbox.vacationActivated = false;

          return asyncJmapAction('Modification of vacation settings', function(client) {
            return client.setVacationResponse(new jmap.VacationResponse(client, { isEnabled: false }))
              .then(function() {
                $rootScope.$broadcast(INBOX_EVENTS.VACATION_STATUS);
              });
          }).catch(function() {
            $rootScope.inbox.vacationActivated = true;
          });
        };

        $scope.$on(INBOX_EVENTS.VACATION_STATUS, _updateVacationStatus);

        _updateVacationStatus();
      },
      controllerAs: 'ctrl',
      templateUrl: '/unifiedinbox/views/partials/inbox-vacation-indicator.html'
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

  .directive('inboxClearFiltersButton', function($rootScope, inboxFilteringService, INBOX_EVENTS) {
    return {
      restrict: 'E',
      scope: {},
      controller: function() {
        this.clearFilters = function() {
          inboxFilteringService.clearFilters();

          $rootScope.$broadcast(INBOX_EVENTS.FILTER_CHANGED);
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
