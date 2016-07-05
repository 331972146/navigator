var mongoose = require('mongoose');
var postModel = mongoose.model('Post');
function Comment(query, comment) {
  this.query = query;
  this.comment = comment;
}
module.exports = Comment;
Comment.prototype.save = function(callback) {
  var query = this.query,
      comment = this.comment;
      comment.status = 0;
  postModel.update(query, {
    $push: {
      "comments": comment
    }
  }, function (err) {
    if (err) {
      return callback(err);
    }
    callback(null);
  });
};