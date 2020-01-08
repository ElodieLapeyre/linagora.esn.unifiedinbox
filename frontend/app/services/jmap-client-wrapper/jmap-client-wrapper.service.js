(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .factory('jmap', function($window) {
      return $window.jmap;
    })

    .factory('dollarQPromiseProvider', function($q) {
      return {
        newPromise: function(resolver) {
          return $q(resolver);
        }
      };
    })

    .factory('dollarHttpTransport', function($http) {
      return {
        post: function(url, headers, data) {
          return $http.post(url, data, { headers: headers }).then(function(response) {
            return response.data;
          });
        }
      };
    });

})(angular);
