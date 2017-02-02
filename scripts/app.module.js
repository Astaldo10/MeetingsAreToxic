(function(){

    'use strict';

    // Configure the module
    angular.module('OfficeAddin').config(['$logProvider', function($logProvider){

        // Set debug logging to on
        if ($logProvider.debugEnabled) {
            $logProvider.debugEnabled(true);
        }
    }])
    // Add the toxicity directive
    .directive('toxicity', function (){
        return {
            templateUrl: 'templates/toxicity.html'
        };
    });

})();
