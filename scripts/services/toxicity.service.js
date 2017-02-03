(function (){
  
    'use strict';

    // Constants to identify Items
    var MEETING_REQUEST = 0,
        CALENDAR_ITEM = 1;

    angular.module('OfficeAddin').service('ToxicityService', ['$q', 'RequestsService', messageService]);


    // Service which controls the data obtention when attending an appointment
    function messageService ($q, RequestsService){

        var message, type, messagePromise = getMessage(), contactsCulturesPromise = RequestsService.getContactsCultures();

        // Waits for the message
        messagePromise.then(function (json){

            var item = json.Envelope.Body.GetItemResponse.ResponseMessages.GetItemResponseMessage.Items;

            if (item.MeetingRequest){

                message = item.MeetingRequest;
                type = MEETING_REQUEST;

            } else if (item.CalendarItem){

                message = item.CalendarItem;
                type = CALENDAR_ITEM;

            }
        });
        
        // Waits for the contacts culture
        /*contactsCulturesPromise.then(function (cultures){
            console.log(cultures);  
        });*/
        
        // Waits for the contacts culture (testing, WIP)
        /*RequestsService.getContactsCultures2().then(function (cultures){
            console.log(cultures);            
        });*/

        return {
            getEmailInfo: getEmailInfo,
            getAppointmentData: getAppointmentData,
            isAppointment: isAppointment,
            rejectMeeting: rejectMeeting
        };


        function getMessage (){

            var itemIdDefer = $q.defer();

            if (!Office.context.mailbox.item.itemId) {

                Office.context.mailbox.item.saveAsync(function(result){
                    itemIdDefer.resolve(result.value);
                });

            } else { itemIdDefer.resolve(Office.context.mailbox.item.itemId); }

            return itemIdDefer.promise.then(function (itemId){
                return RequestsService.getMessage(itemId);
            });

        }


        function getEmailInfo (){
            
            var deferred = $q.defer();

            messagePromise.then(function (){
                deferred.resolve({
                    from: message.Organizer.Mailbox.Name.__text,
                    priority: message.Importance.__text
                });
            });

            return deferred.promise;

        }


        function getAppointmentData (){

            var deferred = $q.defer();

            messagePromise.then(function (){

                var attendees = { required: [], optional: [] };
                var locations, subject, description;

                // Split the locations
                if (message.Location.__text && message.Location.__text !== ''){
                    locations = message.Location.__text.split(';');
                } else {
                    locations = [];
                }

                // Gets the subject, if exists
                if (message.Subject){ subject = message.Subject.__text; }

                // Gets the description inside the body
                description = getDescription(message.Body.__text);

                // Get the required attendees names and store them
                if (message.RequiredAttendees){ attendees.required = getAttendees(message.RequiredAttendees.Attendee); }

                // Get the optional attendees names and store them
                if (message.OptionalAttendees){ attendees.optional = getAttendees(message.OptionalAttendees.Attendee); }

                // If the item is a CalendarItem, the organizer is not included in any attendees group. Add him
                if (type === CALENDAR_ITEM){ attendees.required.push(message.Organizer.Mailbox.__text); }

                deferred.resolve({
                    organizer: message.Organizer.Mailbox.Name.__text,
                    locations: locations,
                    subject: subject,
                    online: message.IsOnlineMeeting.__text === 'true',
                    description: description,
                    attendees: attendees,
                    created: new Date(message.DateTimeCreated.__text),
                    start: new Date(message.Start.__text),
                    end: new Date(message.End.__text),
                    recurring: message.IsRecurring.__text === 'true'
                });

            });

            return deferred.promise;
          
        }


        function isAppointment (){

            var deferred = $q.defer();

            messagePromise.then(function (){
                deferred.resolve(type === MEETING_REQUEST || type === CALENDAR_ITEM);
            });

            return deferred.promise;

        }


        function rejectMeeting (toxicity){

            messagePromise.then(function (){
                RequestsService.rejectMeeting(message.ItemId._Id, message.ItemId._ChangeKey, toxicity);
            });

        }


        function getDescription (string_body){

            var html = new DOMParser().parseFromString(string_body, 'text/html');
            var wrapper = html.getElementById('divtagdefaultwrapper');
            var metas = html.getElementsByTagName('meta');
            var description;

            // Workaround to get the description from Office and Google meeting requests
            if (wrapper !== null) description = (wrapper.textContent === '\n\n\n') ? undefined : wrapper.textContent; // Office wrapper
            else description = (metas[5].content === '') ? undefined : metas[5].content; // Google wrapper
            
            return description;

        }


        function getAttendees (attendees){

            var result = [];

            if (Array.isArray(attendees)){

                attendees.forEach(function(element) {
                    result.push(element.Mailbox.Name.__text);
                }, this);

            } else { result = [attendees.Mailbox.Name.__text]; }

            return result;
                    
        }
    }

})();
