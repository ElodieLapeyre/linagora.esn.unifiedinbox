'use strict';

angular.module('linagora.esn.unifiedinbox')

  .factory('Email', function(inboxMailboxesService, emailSendingService, _, Selectable) {

    function Email(email) {
      var isUnread = email.isUnread;

      Object.defineProperty(email, 'isUnread', {
        get: function() { return isUnread; },
        set: function(state) {
          if (isUnread !== state) {
            inboxMailboxesService.flagIsUnreadChanged(email, state);
            isUnread = state;
          }
        }
      });

      email.hasReplyAll = emailSendingService.showReplyAllButton(email);

      return Selectable(email);
    }

    return Email;
  })

  .factory('Thread', function(_, Selectable) {

    function _defineFlagProperty(object, flag) {
      Object.defineProperty(object, flag, {
        get: function() {
          return _.any(this.emails, flag);
        },
        set: function(state) {
          this.emails.forEach(function(email) {
            email[flag] = state;
          });
        }
      });
    }

    function Thread(thread, emails) {
      _defineFlagProperty(thread, 'isUnread');
      _defineFlagProperty(thread, 'isFlagged');

      thread.setEmails = function(emails) {
        thread.emails = emails || [];

        thread.mailboxIds = thread.emails.length ? thread.emails[0].mailboxIds : [];
        thread.subject = thread.emails.length ? thread.emails[0].subject : '';
        thread.lastEmail = _.last(thread.emails);
        thread.hasAttachment = !!(thread.lastEmail && thread.lastEmail.hasAttachment);
      };

      thread.setEmails(emails);

      return Selectable(thread);
    }

    return Thread;

  })

  .factory('Selectable', function($rootScope, INBOX_EVENTS) {
    function Selectable(item) {
      var isSelected = false;

      item.selectable = true;

      Object.defineProperty(item, 'selected', {
        enumerable: true,
        get: function() { return isSelected; },
        set: function(selected) {
          if (isSelected !== selected) {
            isSelected = selected;
            $rootScope.$broadcast(INBOX_EVENTS.ITEM_SELECTION_CHANGED, item);
          }
        }
      });

      return item;
    }

    return Selectable;
  });
