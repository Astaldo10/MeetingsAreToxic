var scoring = (function(){

    // Toxicity scoring script for meetings: https://github.com/palmerabollo/meetings-toxicity/blob/master/lib/services/scoring.js
    // Original repo: https://github.com/palmerabollo/meetings-toxicity
    // Author: Guido García

    'use strict';


    function score (mail, event) {

        var result = {
            toxicity: 0,
            factors: []
        };

        // XXX proper statistical analysis

        // Location
        var locationsCount = event.locations.length;
        if (event.online){
            result.factors.push({
                toxicity: -5,
                description: 'Online meetings are faster than face to face ones'
            });     
        } else if (locationsCount > 0) {
            if (locationsCount > 1) {
                result.factors.push({
                    toxicity: locationsCount * 5,
                    description: 'Meeting that involve multiple locations (' + locationsCount + ') are usually less productive'
                });
            }
        } else {
            result.factors.push({
                toxicity: 20,
                description: 'People will get lost if they do not know where the meeting will be'
            });
        }

        // Description
        if (!event.description) {
            result.factors.push({
                toxicity: 15,
                description: 'Meeting does not even have a description'
            });
        } else if (event.description.length < 200) {
            result.factors.push({
                toxicity: 10,
                description: 'Meetings without a clear agenda are not productive'
            });
        }

        // Attendees
        var attendeeCount = event.attendees.required.length;
        if (attendeeCount > 10) {
            result.factors.push({
                toxicity: 200,
                description: 'More than 10 people in a meeting? RUN. NOW'
            });
        } else if (attendeeCount > 4) {
            result.factors.push({
                toxicity: 5 * attendeeCount,
                description: 'Meetings with too many attendees (' + attendeeCount + ') are not productive'
            });
        } else if (attendeeCount >= 2 && attendeeCount <= 3) {
            result.factors.push({
                toxicity: -10,
                description: 'Meetings with few attendees (' + attendeeCount + ') are more productive'
            });
        }

        if (event.attendees.optional.length > 0){
            result.factors.push({
                toxicity: -20,
                description: 'It is nice to be polite and allow optional attendees.'
            });
        }

        // Recurring
        if (event.recurring) {
            result.factors.push({
                toxicity: 5,
                description: 'Recurring meetings can often be replaced by an email'
            });
        } else {
            result.factors.push({
                toxicity: -5,
                description: 'Recurring meetings are often useless. This one looks good'
            });
        }

        // Start time
        if (event.start - event.created < 24 * 60 * 60 * 1000) {
            result.factors.push({
                toxicity: 5,
                description: 'Meetings without time to prepare them are useless'
            });
        }

        // Duration
        var duration = event.end - event.start;
        if (duration > 40 * 60 * 1000) {
            if (duration > 60 * 60 * 1000) {
                result.factors.push({
                    toxicity: (event.end - event.start) / (60 * 1000) - 30,
                    description: 'The meeting takes more than 1 hour. Are you serious?'
                });
            } else {
                result.factors.push({
                    toxicity: 30,
                    description: 'It is not possible to stay focused more than 30 minutes'
                });
            }
        } else if (duration < 30 * 60 * 1000) {
            result.factors.push({
                toxicity: -5,
                description: 'Short meetings make you come to the meeting prepared'
            });
        }

        // Day of week
        var dayOfWeek = event.start.getUTCDay();
        if (dayOfWeek === 6 || dayOfWeek === 0){ // Saturday or Sunday
            result.factors.push({
                toxicity: 30,
                description: 'Who the hell sets up a meeting on weekend?'
            });
        }

        // Work time
        var startWork = new Date(0, 0, 0, 8, 0, 0, 0), endWork = new Date(0, 0, 0, 21, 0, 0, 0), outOfWorkMeetingMinutes,
            meetingStart = new Date(0, 0, 0, event.start.getHours(), event.start.getMinutes(), event.start.getSeconds(), 0),
            meetingEnd = new Date(0, 0, 0, event.end.getHours(), event.end.getMinutes(), event.end.getSeconds(), 0);

        if (meetingEnd <= startWork || meetingStart >= endWork){
            outOfWorkMeetingMinutes = (meetingEnd - meetingStart) / 60000;
        } else if (meetingStart < startWork && meetingEnd > endWork){
            outOfWorkMeetingMinutes = ((startWork - meetingStart) + (meetingEnd - endWork)) / 60000;
        } else if (meetingStart < startWork){
            outOfWorkMeetingMinutes = (startWork - meetingStart) / 60000;
        } else if (meetingEnd > endWork){
            outOfWorkMeetingMinutes = (meetingEnd - endWork) / 60000;
        }

        if (outOfWorkMeetingMinutes){
            result.factors.push({
                toxicity: outOfWorkMeetingMinutes,
                description: 'People needs to rest (' + outOfWorkMeetingMinutes + ' out of work minutes)'
            });
        }

        // Lunch time
        var lunchStart = new Date(0, 0, 0, 13, 0, 0, 0), lunchEnd = new Date(0, 0, 0, 15, 0, 0, 0), lunchMeetingMinutes;
        if (meetingStart >= lunchStart && meetingStart < lunchEnd){
            if (meetingEnd < lunchEnd){ lunchMeetingMinutes = (meetingEnd - meetingStart) / 60000; }
            else { lunchMeetingMinutes = (lunchEnd - meetingStart) / 60000; }
        } else if (meetingStart < lunchStart && meetingEnd > lunchStart){
            if (meetingEnd < lunchEnd){ lunchMeetingMinutes = (meetingEnd - lunchStart) / 60000; }
            else { lunchMeetingMinutes = (lunchEnd - lunchStart) / 60000; }
        }

        if (lunchMeetingMinutes){
            result.factors.push({
                toxicity: lunchMeetingMinutes,
                description: 'This is lunch time, not meeting time (' + lunchMeetingMinutes + ' lunch time minutes)'
            });
        }

        // Subject

        if (event.subject){
            var subject = event.subject.toLowerCase();
            if (subject.includes('seguimiento') || subject.includes('follow up')){
                result.factors.push({
                    toxicity: 30,
                    description: 'Send a god dammit email'
                });
            }

            if (subject.length < 3){
                result.factors.push({
                    toxicity: 5,
                    description: 'Short subjects are not very descriptive'
                });
            } 
        } else {
            result.factors.push({
                toxicity: 15,
                description: 'A short subject is better than no subject'
            });
        }

        // TODO ORGANIZER historic data
        // TODO WEIRD HOURS (MEAL, WORKING HOURS, ETC)

        result.toxicity = result.factors.reduce(function(a, b) { return a + b.toxicity; }, 0);
        return result;

    }


    function cost(mail, event) {

        var attendee = event.getProperties('ATTENDEE');
        var attendeeCount = attendee.length;

        var start = new Date(event.getPropertyValue('DTSTART'));
        var end = new Date(event.getPropertyValue('DTEND'));

        var hours = (end - start) / (1000 * 60 * 60);

        return {
            hours: hours,
            attendees: attendeeCount
        };
    }


    return {
        score: score,
        cost: cost
    };
    
})();