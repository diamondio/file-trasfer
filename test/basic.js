var assert = require('assert');
var fs = require('fs-extra');
var express = require('express');
var transfer = require('../lib/transfer');
var bodyParser = require('body-parser');
var uuid = require('node-uuid');

var checkFilesEqual = function (file1, file2, cb) {
  var s1 = '';
  var s2 = '';

  var pruneSame = function () {
    if (s1.startsWith(s2)) {
      s1 = s1.substring(s2.length);
      s2 = '';
    } else if (s2.startsWith(s1)) {
      s2 = s2.substring(s1.length);
      s1 = '';
    }
  }

  var f1_closed = false;
  var f2_closed = false;

  fs.createReadStream(file1)
  .on('data', function (chunk) {
    s1 += chunk;
    pruneSame();
  })
  .on('end', function () {
    f1_closed = true;
    if (f2_closed) {
      return cb(s2 === s1);
    }
  });  

  fs.createReadStream(file2)
  .on('data', function (chunk) {
    s2 += chunk;
    pruneSame();
  })
  .on('end', function () {
    f2_closed = true;
    if (f1_closed) {
      return cb(s2 === s1);
    }
  });
}


describe('Basic Upload Cases', function() {
  it('upload one small file', function (done) {
    var app = express();
    app.use(bodyParser.json());
    var testfile = uuid.v4();

    app.post('/upload', transfer.middleware({chunkExpiry: 0, maxFileSize: 1000, filePath: (req, filename, cb) => cb(null, `/tmp/` + testfile)}), function (req, res, next) {
      res.status(200);
      next();
    });

    var server = app.listen(3000, function () {
      transfer.upload({url: 'http://localhost:3000/upload', filePath: './test/resources/testfile'}, function (err) {
        assert.ok(!err);
        checkFilesEqual('./test/resources/testfile', '/tmp/' + testfile, function (equal) {
          assert.ok(equal);
          server.close();
          done();
        });
      });
    });
  });


  it('upload one small file in many pieces', function (done) {
    var app = express();
    app.use(bodyParser.json());
    var testfile = uuid.v4();

    app.post('/upload', transfer.middleware({chunkExpiry: 0, maxFileSize: 1000, filePath: (req, filename, cb) => cb(null, `/tmp/` + testfile)}), function (req, res, next) {
      res.status(200);
      next();
    });

    var server = app.listen(3000, function () {
      transfer.upload({url: 'http://localhost:3000/upload', filePath: './test/resources/testfile', chunkSize: 2}, function (err) {
        assert.ok(!err);
        checkFilesEqual('./test/resources/testfile', '/tmp/' + testfile, function (equal) {
          assert.ok(equal);
          server.close();
          done();
        });
      });
    });
  });


  it('upload one small file with smallest possible chunk size', function (done) {
    var app = express();
    app.use(bodyParser.json());
    var testfile = uuid.v4();

    app.post('/upload', transfer.middleware({chunkExpiry: 0, maxFileSize: 1000, filePath: (req, filename, cb) => cb(null, `/tmp/` + testfile)}), function (req, res, next) {
      res.status(200);
      next();
    });

    var server = app.listen(3000, function () {
      transfer.upload({url: 'http://localhost:3000/upload', filePath: './test/resources/testfile', chunkSize: 1}, function (err) {
        assert.ok(!err);
        checkFilesEqual('./test/resources/testfile', '/tmp/' + testfile, function (equal) {
          assert.ok(equal);
          server.close();
          done();
        });
      });
    });
  });
});