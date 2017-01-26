// Create the module
angular.module('officeAddin', ['xml']);

// When Office has initalized, manually bootstrap the app
Office.initialize = function(){
    angular.bootstrap(document.getElementById('container'), ['officeAddin']);
};