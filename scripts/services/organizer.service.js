(function (){
  
    'use strict';

    angular.module('officeAddin').service('organizerService', ['$q', 'itemCasterService', organizerService]);


    // Service which controls the data obtention when organizing an appointment
    function organizerService ($q, itemCasterService){

        return {
            getMailData: getMailData,
            getAppointmentData: getAppointmentData
        };


        function getMailData (){

            var deferred = $q.defer();
            var item = itemCasterService.getComposeItem(Office.context.mailbox.item);

            deferred.resolve({
                from: Office.context.mailbox.userProfile.displayName,
                priority: ''
            });

            return deferred.promise;
        
        }


        function getAppointmentData (){

            var deferred = $q.defer();
            var item = itemCasterService.getComposeItem(Office.context.mailbox.item);
            var locationDefer = $q.defer();
            var subjectDefer = $q.defer();
            var bodyDefer = $q.defer();
            var attendeesDefer = $q.defer();
            var requiredAttendeesDefer = $q.defer();
            var optionalAttendeesDefer = $q.defer();
            var attendeesData = {};
            var appointmentData = {};

            // Split the locations
            item.location.getAsync(function (result){

                if (result.value !== ''){
                    locationDefer.resolve(result.value.split(';'));
                } else {
                    locationDefer.resolve([]);
                }

            });

            // Get the subject
            item.subject.getAsync(function (result){
                subjectDefer.resolve(result.value);
            });

            // Get the appointment description
            item.body.getAsync(Office.CoercionType.Text, function (result){
                bodyDefer.resolve(result.value);
            });

            // Get the required attendees names
            item.requiredAttendees.getAsync(function (result){

                var attendees = [];
                result.value.forEach(function(element) {
                    attendees.push(element.displayName);
                }, this);
                requiredAttendeesDefer.resolve(attendees);

            });

            // Get the optional attendees name
            item.optionalAttendees.getAsync(function (result){

                var attendees = [];
                result.value.forEach(function(element) {
                    attendees.push(element.displayName);
                }, this);
                optionalAttendeesDefer.resolve(attendees);

            });

            // Store the attendes in an object
            requiredAttendeesDefer.promise.then(function (required){
                attendeesData.required = required;
                return optionalAttendeesDefer.promise;
            })
            .then(function (optional){
                attendeesData.optional = optional;
                attendeesDefer.resolve(attendeesData);
            });

            // Chain the promises to return the whole data
            locationDefer.promise.then(function (location){
                appointmentData.location = location;
                return subjectDefer.promise;
            })
            .then(function (subject){
                appointmentData.subject = subject;
                return bodyDefer.promise;
            })
            .then(function (body){
                appointmentData.description = body;
                return attendeesDefer.promise;
            })
            .then(function (attendees){
                appointmentData.attendees = attendees;
                appointmentData.organizer = Office.context.mailbox.userProfile.displayName;
                appointmentData.created = item.dateTimeCreated;
                appointmentData.start = item.start;
                appointmentData.end = item.end;
                deferred.resolve(appointmentData);
            });

            return deferred.promise;
        
        }
    }

})();