(function() {
  'use strict';

  angular.module('esn.collaboration')
    .directive('esnCollaborationInviteUsers', esnCollaborationInviteUsers);

  function esnCollaborationInviteUsers($q, $rootScope, notificationFactory, session, esnCollaborationService, esnCollaborationClientService, userUtils) {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        objectType: '@',
        collaboration: '='
      },
      templateUrl: '/views/modules/collaboration/invite/collaboration-invite-users.html',
      link: link
    };

    function link($scope, $element) {
      $scope.displayProperty = 'displayName';
      $scope.running = false;

      $scope.getErrorDiv = function() {
        return $element.find('[error-container]');
      };

      $scope.showErrorMessage = function() {
        $scope.getErrorDiv().removeClass('hidden');
      };

      $scope.hideErrorMessage = function() {
        $scope.getErrorDiv().addClass('hidden');
      };

      $scope.showSuccessMessage = function() {
        notificationFactory.weakInfo('Invitations have been sent', 'You will be notified when new users join the collaboration.');
      };

      $scope.resetMessages = function() {
        $scope.hideErrorMessage();
      };

      $scope.getInvitablePeople = function(query) {
        $scope.query = query;
        var deferred = $q.defer();

        esnCollaborationClientService.getInvitablePeople($scope.objectType, $scope.collaboration._id, {search: query, limit: 5}).then(
          function(response) {
            var cache = Object.create(null);

            response.data.forEach(function(user) {
              user.displayName = userUtils.displayNameOf(user);

              if ((user.displayName in cache) && user.displayName !== user.preferredEmail) {
                user.displayName += ' - ' + user.preferredEmail;
              }
              cache[user.displayName] = true;

              $scope.query = '';
            });
            deferred.resolve(response);
          },
          function(error) {
            deferred.resolve(error);
          }
        );

        return deferred.promise;
      };

      $scope.inviteUsers = function() {
        $scope.hideErrorMessage();
        $scope.noUser = false;
        $scope.invalidUser = false;
        if ($scope.query && $scope.query !== '') {
          $scope.invalidUser = $scope.query;
          $scope.showErrorMessage();
          if (!$scope.users || $scope.users.length === 0) {
            $scope.query = '';

            return;
          }
        } else if (!$scope.users || $scope.users.length === 0) {
          $scope.noUser = true;
          $scope.showErrorMessage();

          return;
        }

        if ($scope.running) {
          return;
        }

        $scope.resetMessages();
        $scope.running = true;

        var promises = $scope.users.map(function(user) {
          return esnCollaborationClientService.requestMembership($scope.objectType, $scope.collaboration._id, user._id);
        });

        $q.all(promises).then(
          function() {
            $scope.users = [];
            $scope.running = false;
            $scope.showSuccessMessage();
            if ($scope.query && $scope.query !== '') {
              $scope.invalidUser = $scope.query;
              $scope.showErrorMessage();
            }
            $rootScope.$emit('collaboration:invite:users');
          },
          function(error) {
            $scope.users = [];
            $scope.error = error.data;
            $scope.running = false;
            $scope.showErrorMessage();
          }
        );
      };

      if (esnCollaborationService.isManager($scope.collaboration, session.user)) {
        $element.removeClass('hidden');
      }
    }
  }
})();
