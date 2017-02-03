(function (){

    'use strict';

    angular.module('OfficeAddin').service('RequestsService', ['$q', 'x2js', requestsService]);


    // Service which controls the EWS requests
    function requestsService ($q, x2js){


        return {
            getMessage: getMessage,
            getContactsCultures: getContactsCultures,
            getContactsCultures2: getContactsCultures2
        };


        function getMessage (messageId){

            var deferred = $q.defer();

            Office.context.mailbox.makeEwsRequestAsync(getRequestEnvelope(getMessageRequest(messageId)), function (result){
                deferred.resolve(x2js.xml_str2json(result.value));
            });

            return deferred.promise;

        }


        function getContactsCultures (){

            var deferred = $q.defer();

            findAllContactsFolder('root').then(function (folder){
                return getAllContactsFolder(folder.id, folder.changeKey);
            }).then(function (items){
                return getContacts(items);
            }).then(function (contacts){

                var contactsCultures = [];

                contacts.forEach(function (contact){

                    if (!contactsCultures.includes(contact.Items.Contact.Culture.__text)){
                        contactsCultures.push(contact.Items.Contact.Culture.__text);
                    }

                });

                deferred.resolve(contactsCultures);

            });

            return deferred.promise;

        }


        function getContactsCultures2 (){

            var deferred = $q.defer();
            var id = 'AAMkADA1ZjIzMjc4LTNhZWEtNDkxZS1hYzIxLTc1ODU4YzU2MGNiZgAuAAAAAAAf3wyX9YrCTZK1BF94h/QSAQAPhqMY2whET7JH6ZxO59QjAAAM0EwtAAA=';
            var changeKey = 'BwAAABYAAAAPhqMY2whET7JH6ZxO59QjAAAM0Etm';

            getAllContactsFolder(id, changeKey).then(function (items){
                return getContacts(items);
            }).then(function (contacts){

                var contactsCultures = [];

                contacts.forEach(function (contact){

                    if (!contactsCultures.includes(contact.Items.Contact.Culture.__text)){
                        contactsCultures.push(contact.Items.Contact.Culture.__text);
                    }

                });

                deferred.resolve(contactsCultures);

            });

            return deferred.promise;

        }


        function findAllContactsFolder (rootFolder){

            var deferred = $q.defer();
            var rootFolderXML = '<t:DistinguishedFolderId Id="' + rootFolder + '"/>';
            
            Office.context.mailbox.makeEwsRequestAsync(getRequestEnvelope(findFoldersRequest(rootFolderXML)), function (result){

                var folders = (x2js.xml_str2json(result.value)).Envelope.Body.FindFolderResponse.ResponseMessages.FindFolderResponseMessage.RootFolder.Folders;
                var id, changeKey;

                folders.SearchFolder.some(function (element){

                    if (element.DisplayName.__text === 'AllContacts'){
                        
                        id = element.FolderId._Id;
                        changeKey = element.FolderId._ChangeKey;
                        return true;

                    }

                    return false;

                });

                deferred.resolve({ id: id, changeKey: changeKey });

            });

            return deferred.promise;

        }


        function getAllContactsFolder (id, changeKey){

            var deferred = $q.defer();
            var allContactsXML = '<t:FolderId Id="' + id + '" ChangeKey="' + changeKey + '" />';

            Office.context.mailbox.makeEwsRequestAsync(getRequestEnvelope(findItemsRequest(allContactsXML)), function (result){

                var contacts = (x2js.xml_str2json(result.value)).Envelope.Body.FindItemResponse.ResponseMessages.FindItemResponseMessage;
                var contactsArray = [];

                contacts.RootFolder.Items.Contact.forEach(function (element){

                    contactsArray.push({
                        id: element.ItemId._Id,
                        changeKey: element.ItemId._ChangeKey
                    });

                });

                deferred.resolve(contactsArray);

            });

            return deferred.promise;

        }


        function getContacts (contacts){

            var deferred = $q.defer();
            var contactsXML = '';

            contacts.forEach(function (element){
                contactsXML += '<t:ItemId Id="' + element.id + '" ChangeKey="' + element.changeKey + '" />';
            });

            Office.context.mailbox.makeEwsRequestAsync(getRequestEnvelope(getItemsRequest(contactsXML)), function (result){
                deferred.resolve((x2js.xml_str2json(result.value)).Envelope.Body.GetItemResponse.ResponseMessages.GetItemResponseMessage);
            });

            return deferred.promise;

        }


        function getMessageRequest (messageId){

            return  '<m:GetItem>' +
                    '   <m:ItemShape>' +
                    '       <t:BaseShape>IdOnly</t:BaseShape>' +
                    '       <t:AdditionalProperties>' +
                    '           <t:FieldURI FieldURI="calendar:Organizer"/>' +
                    '           <t:FieldURI FieldURI="calendar:Location"/>' +
                    '           <t:FieldURI FieldURI="calendar:IsOnlineMeeting"/>' +
                    '           <t:FieldURI FieldURI="calendar:RequiredAttendees"/>' +
                    '           <t:FieldURI FieldURI="calendar:OptionalAttendees"/>' +
                    '           <t:FieldURI FieldURI="calendar:Start"/>' +
                    '           <t:FieldURI FieldURI="calendar:End"/>' +
                    '           <t:FieldURI FieldURI="calendar:IsRecurring"/>' +
                    '           <t:FieldURI FieldURI="item:Subject"/>' +
                    '           <t:FieldURI FieldURI="item:Body"/>' +
                    '           <t:FieldURI FieldURI="item:DateTimeCreated"/>' +
                    '           <t:FieldURI FieldURI="item:Importance"/>' +
                    '       </t:AdditionalProperties>' +
                    '   </m:ItemShape>' +
                    '   <m:ItemIds><t:ItemId Id="' + messageId + '"/></m:ItemIds>' +
                    '</m:GetItem>';

        }


        function findFoldersRequest (rootFoldersXML){

            return  '<m:FindFolder Traversal="Shallow">' +
                    '   <m:FolderShape>' +
                    '       <t:BaseShape>Default</t:BaseShape>' +
                    '   </m:FolderShape>' +
                    '   <m:ParentFolderIds>' +
                            rootFoldersXML +
                    '   </m:ParentFolderIds>' +
                    '</m:FindFolder>';

        }


        function findItemsRequest (foldersXML){

            return  '<m:FindItem Traversal="Shallow">' +
                    '   <m:ItemShape>' +
                    '       <t:BaseShape>IdOnly</t:BaseShape>' +
                    '   </m:ItemShape>' +
                    '   <m:ParentFolderIds>' +
                            foldersXML +
                    '   </m:ParentFolderIds>' +
                    '</m:FindItem>';

        }


        function getItemsRequest (contactsXML){

            return  '<m:GetItem>' +
                    '   <m:ItemShape>' +
                    '       <t:BaseShape>AllProperties</t:BaseShape>' +
                    '   </m:ItemShape>' +
                    '   <m:ItemIds>' +
                            contactsXML +
                    '   </m:ItemIds>' +
                    '</m:GetItem>';

        }


        function getRequestEnvelope (request){

            return  '<?xml version="1.0" encoding="utf-8"?>' +
                    '<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
                    '               xmlns:xsd="http://www.w3.org/2001/XMLSchema"' +
                    '               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"' +
                    '               xmlns:t="http://schemas.microsoft.com/exchange/services/2006/types"' +
                    '               xmlns:m="http://schemas.microsoft.com/exchange/services/2006/messages">' +
                    '   <soap:Header>' +
                    '       <t:RequestServerVersion Version="Exchange2013"/>' +
                    '   </soap:Header>' +
                    '   <soap:Body>' +
                            request +
                    '   </soap:Body>' +
                    '</soap:Envelope>';

        }
    }

})();