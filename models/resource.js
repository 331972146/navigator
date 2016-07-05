var mongoose = require('mongoose'),
    timeGen = require('../helpers/timeGen');
var resourceSchema = new mongoose.Schema({
  userId:  { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  url: String, 
  path: String, 
  fileName: String,
  fileSize: String,
  resType: String, 
  usageType: String, 
  headline: String,
  md5: String,
  uploadTime: {},
  extInfo: {
    host: String,
    domain: String
  }
}, {
});
var resourceModel = mongoose.model('Resource', resourceSchema);
function Resource(resObj) {
  this.resObj = resObj;
}
Resource.prototype.save = function(callback) {
  var time = timeGen();
  var resource = this.resObj;
      resource.uploadTime = time;
  var newResource = new resourceModel(resource);
  newResource
  .save(function (err, newRes) {
    if (err) {
      return callback(err);
    }
    callback(null, newRes);
  });
};
Resource.getOne = function(query, callback) {
  resourceModel
  .findOne(query, function (err, file) {
    if (err) {
      return callback(err);
    }    
    callback(null, file);
  });
};
Resource.getSome = function(query, callback) {
  resourceModel
  .find(query)
  .sort({
    'uploadTime.date': -1
  })
  .exec(function (err, files) {
    if (err) {
      return callback(err);
    }
    callback(null, files)
  });
};
module.exports = Resource;