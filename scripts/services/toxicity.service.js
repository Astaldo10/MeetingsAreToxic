(function (){
  
    'use strict';

    // Constants to identify Items
    var MEETING_REQUEST = 0,
        CALENDAR_ITEM = 1;

    angular.module('officeAddin').service('toxicityService', ['$q', 'x2js', messageService]);


    // Service which controls the data obtention when attending an appointment
    function messageService ($q, x2js){

        var emailPromise, email, type;

        emailPromise = getEmail();
        emailPromise.then(function (json){

            var item = json.Envelope.Body.GetItemResponse.ResponseMessages.GetItemResponseMessage.Items;

            if (item.MeetingRequest){

                email = item.MeetingRequest;
                type = MEETING_REQUEST;

            } else if (item.CalendarItem){

                email = item.CalendarItem;
                type = CALENDAR_ITEM;

            }
        });

        return {
            getEmailInfo: getEmailInfo,
            getAppointmentData: getAppointmentData
        };


        function getEmail (){

            var deferred = $q.defer();
            var itemIdDefer = $q.defer();

            if (!Office.context.mailbox.item.itemId) {

                Office.context.mailbox.item.saveAsync(function(result){
                    itemIdDefer.resolve(result.value);
                });

            } else { itemIdDefer.resolve(Office.context.mailbox.item.itemId); }

            itemIdDefer.promise.then(function (itemId){

                Office.context.mailbox.makeEwsRequestAsync(getRequestEnvelope(
                    getMessageRequest(itemId)), function (result){
                    deferred.resolve(x2js.xml_str2json(result.value));
                });

            });

            return deferred.promise;

        }


        function getEmailInfo (){
            
            var deferred = $q.defer();

            emailPromise.then(function (){
                deferred.resolve({
                    from: email.Organizer.Mailbox.Name.__text,
                    priority: email.Importance.__text
                });
            });

            return deferred.promise;

        }


        function getAppointmentData (){

            var deferred = $q.defer();

            emailPromise.then(function (){

                var attendees = { required: [], optional: [] }
                var locations, subject, description, recurring;

                // Split the locations
                if (email.Location.__text && email.Location.__text !== ''){
                    locations = email.Location.__text.split(';');
                } else {
                    locations = [];
                }

                // Gets the subject, if exists
                if (email.Subject){ subject = email.Subject.__text; }

                // Gets the description inside the body
                description = getDescription(email.Body.__text);

                // Get the required attendees names and store them
                if (email.RequiredAttendees){ attendees.required = getAttendees(email.RequiredAttendees.Attendee); }

                // Get the optional attendees names and store them
                if (email.OptionalAttendees){ attendees.optional = getAttendees(email.OptionalAttendees.Attendee); }

                // If the item is a CalendarItem, the organizer is not included in any attendees group. Add him
                if (type === CALENDAR_ITEM){ attendees.required.push(email.Organizer.Mailbox.__text); }

                // Check meeting recurrence
                if (email.Recurrence) { recurring = true; }

                deferred.resolve({
                    organizer: email.Organizer.Mailbox.Name.__text,
                    locations: locations,
                    subject: subject,
                    description: description,
                    attendees: attendees,
                    created: new Date(email.DateTimeCreated.__text),
                    start: new Date(email.Start.__text),
                    end: new Date(email.End.__text),
                    recurring: recurring
                });

            });

            return deferred.promise;
          
        }


        function getMessageRequest (messageId){

            return '<GetItem xmlns="http://schemas.microsoft.com/exchange/services/2006/messages">' +
            '   <ItemShape>' +
            '       <t:BaseShape>AllProperties</t:BaseShape>' +
            /*'       <t:AdditionalProperties>' +
            '           <t:FieldURI FieldURI="item:Subject"/>' +
            '       </t:AdditionalProperties>' +*/
            '   </ItemShape>' +
            '   <ItemIds><t:ItemId Id="' + messageId + '"/></ItemIds>' +
            '</GetItem>';

        }


        function getRequestEnvelope (request){

            return '<?xml version="1.0" encoding="utf-8"?>' +
            '<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
            '               xmlns:xsd="http://www.w3.org/2001/XMLSchema"' +
            '               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"' +
            '               xmlns:t="http://schemas.microsoft.com/exchange/services/2006/types">' +
            '   <soap:Header>' +
            '       <t:RequestServerVersion Version="Exchange2013"/>' +
            '   </soap:Header>' +
            '   <soap:Body>' +

            request +

            '   </soap:Body>' +
            '</soap:Envelope>';

        }


        function getDescription (string_body){

            var html = new DOMParser().parseFromString(string_body, 'text/html');
            var description = html.getElementById('divtagdefaultwrapper').textContent;
            return (description === '\n\n\n') ? undefined : description;

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
