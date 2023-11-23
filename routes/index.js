
var Service = require('../api/service');

module.exports = function (router) {

	router.get('*',function (req, res) {
        //console.log("404 Hit");
        res.status(404).send();
    });
    
    
}