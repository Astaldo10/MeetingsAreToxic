// Create the module
angular.module('OfficeAddin', ['xml']);

// When Office has initalized, manually bootstrap the app
Office.initialize = function(){
    angular.bootstrap(document.getElementById('container'), ['OfficeAddin']);
};