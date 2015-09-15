var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({

  tableName: 'users',
  hasTimestamps: true,
  defaults: {
    username: 'ben'
  },
  initialize: function(){

    this.on('creating', function(model, attrs, options){
      var salt = bcrypt.genSaltSync(10);
      var hash = bcrypt.hashSync(model.get('password'), salt);

      model.set('password', hash);
      model.set('salt', salt);
    });


  // first attempt to complete problem async:

  //   this.on('creating', function(model, attrs, options){
  //     console.log('starting passhash func...');
  //     new Promise(function(resolve, reject){
  //       bcrypt.genSalt(10, function(err, salt){
  //         if (err){reject(err); }
  //         else {resolve(salt); }
  //       })
  //     }).then(function(salt){
  //       model.save('salt', salt);

  //       new Promise(function(resolve, reject) {
  //         bcrypt.hash(model.attributes.password, salt, null, function(err, hash) {
  //           if (err) {
  //             reject(err);
  //           } else {
  //             resolve(hash);
  //           }
  //         })
  //       }).then(function(hash) {
  //         model.save('password', hash);
  //       }).catch(function(err) {
  //         console.log('error1', err);
  //       });
  //     });
  //   });
  }
});

module.exports = User;