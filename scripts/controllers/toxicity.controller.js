(function (){

    'use strict';

    angular.module('officeAddin').controller('ToxicityController',
        ['toxicityService', '$stateParams', toxicityController]);


    // Application controller
    function toxicityController (service, $stateParams){

        var ctrl = this;  // jshint ignore:line

        // Controller data sets
        var email = {};
        var appointment = {};
        ctrl.score = {};
        ctrl.getBackground = getToxicityBackground;

        service.getEmailInfo().then(function (response){
            email = response;
            return service.getAppointmentData();
        }).then(function (response){
            appointment = response;
            ctrl.score = scoring.score(email, appointment);
        });

        // Gets the toxicity background according to the toxicity level reached
        function getToxicityBackground (){

            if (ctrl.score.toxicity === undefined){
                return 'transparent';
            } else if (ctrl.score.toxicity <= 33){
                return 'green';
            } else if (ctrl.score.toxicity > 33 && ctrl.score.toxicity <= 67){
                return 'yellow';
            } else {
                return 'red';
            }
        }
    }

})();
