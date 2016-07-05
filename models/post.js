// var markdown = require('markdown').markdown;
var mongoose = require('mongoose'),
    timeGen = require('../helpers/timeGen');
var postSchema = new mongoose.Schema({
  userId:  { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  userRole: String, 
  head: String, 
  title: String,
  subTitle: String,
  type: Number,
  tags: [], 
  itemName: String, 
  itemType: { type: Number, enum: [0,1,2,3,4,5,6,7,8,9] }, 
  itemSpec: { 
  },
  itemDate: Date, 
  expirationDate: Number, 
  itemCert: String, 
  itemSupplierId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  price: Number, 
  stock: Number, 
  inner: Number, 
  solo: Number, 
  retail: Number, 
  cost: Number, 
  profit: Number, 
  delivery: { 
  },
  contact: [{_id: false, title: {type: String}, No: {type: String}}], 
  payment: [{_id: false, title: {type: String}, account: {type: String}}], 
  action: String, 
  post: String, 
  status: { type: Number, enum: [0,1,2] },
  auditedBy: { 
    time: Date,
    userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'}
  },
  time: {}, 
  IP: String,
  reviseTime: [], 
  comments: [{_id: false, score: {type: Number}, content: {type: String}}],
  reprintInfo: {}, 
  author: String, 
  source: String, 
  pv: Number, 
  fav: Number, 
  cart: Number, 
  buyers: Number, 
  returns: Number, 
  sort: Number, 
  openTarget: String, 
  position: String, 
  sort: Number, 
  isShown: Boolean, 
  resources: {
  },
  extInfo: {
    host: String,
    domain: String
  }
}, {
});
var postModel = mongoose.model('Post', postSchema);
function Post(postObj) {
  this.postObj = postObj;
}
Post.prototype.save = function(callback) {
  var time = timeGen();
  var post = this.postObj;
      post.status = 0;
      post.time = time;
      post.reprintInfo = {};
      post.pv = 0;
  var newPost = new postModel(post);
  newPost
  .save(function (err, newPost) {
    if (err) {
      return callback(err);
    }
    callback(null, newPost);
  });
};
Post.getSome = function(query, page, articlePerPage, callback) {
  postModel
  .count(query)
  .count(function (err, total) {
    postModel
    .find(query)
    .skip((page - 1) * articlePerPage)
    .limit(articlePerPage)
    .sort({
      time: -1
    })
    .exec(function (err, docs) {
      if (err) {
        return callback(err);
      }
      callback(null, docs, total)
    });
  });
};
Post.getOne = function(query, callback) {
  postModel
  .findOne(query, function (err, doc) {
    if (err) {
      return callback(err);
    }    
    if (doc) {
      postModel
      .update(query, {
        $inc: {
          "pv": 1
        }
      }, function (err) {
        if (err) {
          return callback(err);
        }
      });
    }
    callback(null, doc)
  });
};
Post.edit = function(query, callback) {
  postModel
  .findOne(query, function (err, doc) {
    if (err) {
      return callback(err);
    }
    callback(null, doc)
  });
};
Post.update = function(query, obj, callback) {
  postModel
  .update(query, obj, function (err) {
    if (err) {
      return callback(err);
    }
    callback(null);
  });
};
Post.remove = function(query, callback) {
  postModel
  .findOne(query, function (err, doc) {
    if (err) {
      return callback(err);
    }
    var reprintFrom = "";
    if (doc.reprintInfo.reprintFrom) {
      reprintFrom = doc.reprintInfo.reprintFrom;
    }
    if (reprintFrom != "") {
      postModel
      .update({
        "username": reprintFrom.username,
        "time.second": reprintFrom.second,
        "title": reprintFrom.title
      }, {
        $pull: {
          "reprintInfo.reprintTo": {
            "username": query.username,
            "second": query["time.second"],
            "title": query.title
        }}
      }, function (err) {
        if (err) {
          return callback(err);
        }
      });
    }
    postModel
    .remove(query, function (err) {
      if (err) {
        return callback(err);
      }
      callback(null);
    });
  });
};
Post.getArchive = function(query, callback) {
  postModel
  .find(query, {
    "username": 1,
    "time": 1,
    "title": 1,
    "action": 1
  })
  .sort({
    time: -1
  })
  .exec(function (err, docs) {
    if (err) {
      return callback(err);
    }
    callback(null, docs);
  });
};
Post.getTags = function(query, callback) {
  postModel
  .find(query)
  .distinct("tags", function (err, docs) {
    if (err) {
      return callback(err);
    }
    callback(null, docs);
  });
};
Post.getTag = function(query, callback) {
  postModel
  .find(query, {
    "username": 1,
    "time": 1,
    "title": 1,
    "action": 1
  })
  .sort({
    time: -1
  })
  .exec(function (err, docs) {
    if (err) {
      return callback(err);
    }
    callback(null, docs);
  });
};
Post.search = function(query, keyword, callback) {
  var pattern = new RegExp(keyword, "i");
  postModel
  .find(query)
  .find({
    "title": pattern
  }, {
    "username": 1,
    "time": 1,
    "title": 1,
    "action": 1
  })
  .sort({
    time: -1
  })
  .exec(function (err, docs) {
    if (err) {
      return callback(err);
    }
    callback(null, docs);
  });
};
Post.reprint = function(reprintFrom, reprintTo, callback) {
  postModel
  .findOne(reprintFrom, function (err, doc) {
    if (err) {
      return callback(err);
    }
    var time = timeGen();
    doc.reviseTime.push(time.second);
    var post = {
      username: reprintTo.username,
      head: reprintTo.head,
      title: ((doc.title.search(/[转载]/) > -1) ? doc.title : "[转载]" + doc.title).trim(),
      tags: doc.tags,
      action: reprintTo.action,
      post: doc.post,
      type: doc.type,
      status: doc.status,
      time: time,
      reviseTime: doc.reviseTime,
      comments: [],
      reprintInfo: { "reprintFrom": reprintFrom },
      pv: 0,
      resources: doc.resources,
      extInfo: doc.extInfo
    };
    postModel
    .update(reprintFrom, {
      $push: {
        "reprintInfo.reprintTo": {
          "username": post.username,
          "second": time.second,
          "title": post.title,
          "domain": reprint_to.domain
      }}
    }, function (err) {
      if (err) {
        return callback(err);
      }
    });
    var newPost = new postModel(post);
    newPost
    .save(function (err, newPost) {
      if (err) {
        return callback(err);
      }
      callback(null, newPost);
    });   
  });
};
module.exports = Post;