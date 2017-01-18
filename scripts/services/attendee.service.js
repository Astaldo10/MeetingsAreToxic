(function (){
  
    'use strict';

    angular.module('officeAddin').service('attendeeService', ['$q', 'itemCasterService', attendeeService]);


    // Service which controls the data obtention when attending an appointment
    function attendeeService ($q, itemCasterService){

        return {
            getMailData: getMailData,
            getAppointmentData: getAppointmentData
        };


        function getMailData (){

            var deferred = $q.defer();
            var item = itemCasterService.getReadItem(Office.context.mailbox.item);

            deferred.resolve({
                from: item.organizer.displayName,
                priority: ''
            });

            return deferred.promise;
          
        }


        function getAppointmentData (){

            var deferred = $q.defer();
            var item = itemCasterService.getReadItem(Office.context.mailbox.item);
            var location;
            var bodyDefer = $q.defer();
            var attendees = {
                required: [],
                optional: []
            };

            // Split the locations
            if (item.location !== ''){
                location = item.location.split(';');
            } else {
                location = [];
            }

            // Get the appointment description
            item.body.getAsync(Office.CoercionType.Text, function (result){
                bodyDefer.resolve(result.value);
            });

            // Get the required attendees names and store them
            item.requiredAttendees.forEach(function(element) {
                attendees.required.push(element.displayName);
            }, this);

            // Get the optional attendees names and store them
            item.optionalAttendees.forEach(function(element) {
                attendees.optional.push(element.displayName);
            }, this);

            // Resolve the data promise when the body promise resolves
            bodyDefer.promise.then(function (body){
                deferred.resolve(
                    {
                        organizer: item.organizer.displayName,
                        location: location,
                        subject: item.subject,
                        description: body,
                        attendees: attendees,
                        created: item.dateTimeCreated,
                        start: item.start,
                        end: item.end
                    }
                );
            });

          return deferred.promise;
          
        }
    }

})();
