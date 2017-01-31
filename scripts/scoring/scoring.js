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
        if (dayOfWeek === 5 || dayOfWeek === 6){ // Saturday or Sunday
            result.factors.push({
                toxicity: 30,
                description: 'Who the hell convene sets up a meeting on weekend?'
            });
        }

        // Work and lunch time

        // Subject
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