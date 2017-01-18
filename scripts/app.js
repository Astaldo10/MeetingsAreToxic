// Create the module
angular.module('officeAddin', ['ui.router']);

// When Office has initalized, manually bootstrap the app
Office.initialize = function(){
    angular.bootstrap(document.getElementById('container'), ['officeAddin']);
};