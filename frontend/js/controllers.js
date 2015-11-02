'use strict';

angular.module('linagora.esn.unifiedinbox')
  .controller('listEmailsController', function($scope, $route, jmapClient, EmailGroupingTool) {
    $scope.mailbox = $route.current.params.mailbox;

    jmapClient.getMessageList({
      filter: {
        inMailboxes: [$scope.mailbox]
      },
      collapseThreads: true,
      fetchMessages: true,
      position: 0,
      limit: 100
    }).then(function(data) {
      $scope.groupedEmails = new EmailGroupingTool($scope.mailbox, data[1]).getGroupedEmails(); // data[1] is the array of Messages
    });
  })

  .controller('composerController', function($scope, notificationFactory, emailSendingService, Offline, attendeeService, INBOX_AUTOCOMPLETE_LIMIT) {
    function getToolbarConfiguration() {
      var toolbarConfiguration = [
        ['style', ['bold', 'italic', 'underline', 'strikethrough']],
        ['textsize', ['fontsize']],
        ['alignment', ['paragraph', 'ul', 'ol']],
        ['fullscreen', ['fullscreen']]
      ];
      return toolbarConfiguration;
    }

    $scope.summernoteOptions = {
      focus: true,
      airMode: false,
      toolbar: getToolbarConfiguration()
    };

    this.search = function(query) {
      return attendeeService.getAttendeeCandidates(query, INBOX_AUTOCOMPLETE_LIMIT).then(function(recipients) {
        return recipients.filter(function(recipient) {
          return recipient.email;
        });
      });
    };

    $scope.validateEmailSending = function(rcpt) {
      if (emailSendingService.noRecipient(rcpt)) {
        notificationFactory.weakError('Note', 'Your email should have at least one recipient');
        return false;
      }

      if (!emailSendingService.emailsAreValid(rcpt)) {
        notificationFactory.weakError('Note', 'Some recipient emails are not valid');
        return false;
      }

      if (!Offline.state || Offline.state === 'down') {
        notificationFactory.weakError('Note', 'Your device loses its Internet connection. Try later!');
        return false;
      }

      emailSendingService.removeDuplicateRecipients(rcpt);

      return true;
    };
  })

  .controller('viewEmailController', function($scope, $route, $location, jmapClient, jmap, notificationFactory) {
    $scope.mailbox = $route.current.params.mailbox;
    $scope.emailId = $route.current.params.emailId;

    $scope.moveToTrash = function() {
      $scope.email.moveToMailboxWithRole(jmap.MailboxRole.TRASH)
        .then(function() {
          notificationFactory.weakSuccess('Successfully moved message to trash', '');
          $location.path('/unifiedinbox/' + $scope.mailbox);
        }, function(err) {
          notificationFactory.weakError('Failed to move message to trash', err.message || err);
        });
    };

    jmapClient.getMessages({
      ids: [$scope.emailId]
    }).then(function(messages) {
      $scope.email = messages[0]; // We expect a single message here
    });
  });
