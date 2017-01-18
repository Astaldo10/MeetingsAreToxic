(function (){

    'use strict';

    angular.module('officeAddin').controller('ToxicityController', ['attendeeService', 'organizerService', '$stateParams', attendeeController]);


    // Application controller
    function attendeeController (attendeeService, organizerService, $stateParams){

        var ctrl = this;  // jshint ignore:line
        var service;

        // Controller data sets
        var mail = {};
        var appointment = {};
        ctrl.score = {};
        ctrl.getBackground = getToxicityBackground;

        if ($stateParams.serviceType === 'attendee'){
            service = attendeeService;
        } else if ($stateParams.serviceType === 'organizer'){
            service = organizerService;
        }

        // Gets the mail data, for example, the priority or the email sender direction
        service.getMailData().then(function(response){
          
            mail = response;

            // Gets the appointment data, for example, when it was created or the attendees
            service.getAppointmentData().then(function(response){

                appointment = response;

                // Gets the toxicity score and its factors
                ctrl.score = scoring.score(mail, appointment);
                
            });
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
