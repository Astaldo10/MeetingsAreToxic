(function (){

    'use strict';

    // Load routes
    angular.module('officeAddin').config(['$stateProvider', function ($stateProvider){

        $stateProvider
        .state('organizer', {
            url: '/organizer/',
            templateUrl: 'templates/toxicity.html',
            controller: 'ToxicityController as tc',
            params: { serviceType: 'organizer' }
        })
        .state('attendee', {
            url: '/attendee/',
            templateUrl: 'templates/toxicity.html',
            controller: 'ToxicityController as tc',
            params: { serviceType: 'attendee' }   
        });
    }]);

})();
