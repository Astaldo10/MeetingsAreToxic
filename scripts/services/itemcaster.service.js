(function (){

    'use strict';

    angular.module('officeAddin').service('itemCasterService', ['$q', itemCasterService]);


    // Service which casts an office mailbox item to a read item or to a compose item
    function itemCasterService ($q){

        return {
            getReadItem: getReadItem,
            getComposeItem: getComposeItem
        };


        function getReadItem (uncastedItem){

            var item = Office.cast.item.toItemRead(uncastedItem);

            if (item.itemType === Office.MailboxEnums.ItemType.Message) {
                return Office.cast.item.toMessageRead(Office.context.mailbox.item);
            } else if (item.itemType === Office.MailboxEnums.ItemType.Appointment) {
                return Office.cast.item.toAppointmentRead(Office.context.mailbox.item);
            } else {
                return item;
            }

        }


        function getComposeItem (uncastedItem){

            var item = Office.cast.item.toItemCompose(uncastedItem);

            if (item.itemType === Office.MailboxEnums.ItemType.Message) {
                return Office.cast.item.toMessageCompose(Office.context.mailbox.item);
            } else if (item.itemType === Office.MailboxEnums.ItemType.Appointment) {
                return Office.cast.item.toAppointmentCompose(Office.context.mailbox.item);
            } else {
                return item;
            }
        }
    }

})();