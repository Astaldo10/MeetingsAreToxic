var scoring = (function(){

    // Toxicity scoring script for meetings: https://github.com/palmerabollo/meetings-toxicity/blob/master/lib/services/scoring.js
    // Original repo: https://github.com/palmerabollo/meetings-toxicity
    // Author: Guido García

    'use strict';

    function score (mail, event) {

        /*console.log('from:', mail.from);
        console.log('priority:', mail.priority);
        console.log('organizer:', event.organizer);
        console.log('locations:', event.locations);
        console.log('description:', event.description);
        console.log('attendees:', event.attendees);
        console.log('created:', event.created);
        console.log('start:', event.start);
        console.log('end:', event.end);
        //console.log(event.getPropertyValue('SUMMARY'));
        console.log('recurring': event.recurring);*/

        var result = {
            toxicity: 0,
            factors: []
        };

        // XXX proper statistical analysis

        if (event.locations) {
            var locationsCount = event.locations.length;
            if (locationsCount > 1) {
                result.factors.push({
                    toxicity: locationsCount * 5,
                    description: 'Meeting that involve multiple locations (' + locationsCount + ') are usually less productive'
                });
            }
        } // If there isn't any location, should that be a toxicity indicator?

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

        // What about optional attendees?
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

        if (event.start - event.created < 24 * 60 * 60 * 1000) {
            result.factors.push({
                toxicity: 5,
                description: 'Meetings without time to prepare them are useless'
            });
        }

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
        } // What happens between (30 * 60 * 1000) and (40 * 60 * 1000)?

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