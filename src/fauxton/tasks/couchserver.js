// Licensed under the Apache License, Version 2.0 (the "License"); you may not
// use this file except in compliance with the License. You may obtain a copy of
// the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// License for the specific language governing permissions and limitations under
// the License.

module.exports = function (grunt) {
  var log = grunt.log;

  grunt.registerTask("couchserver", 'Run a couch dev proxy server', function () {
    var fs = require("fs"),
        path = require("path"),
        http = require("http"),
        httpProxy = require('http-proxy'),
        send = require('send'),
        options = grunt.config('couchserver');

    // Options
    var dist_dir = options.dist || './dist/debug/',
        app_dir = './app',
        port = options.port || 8000;

    // Proxy options with default localhost
    var proxy_settings = options.proxy || {
      target: {
        host: 'localhost',
        port: 5984,
        https: false
      }
    };

    // inform grunt that this task is async
    var done = this.async();

    // create proxy to couch for all couch requests
    var proxy = new httpProxy.HttpProxy(proxy_settings);

    http.createServer(function (req, res) {
      var url = req.url,
          accept = req.headers.accept.split(','),
          filePath;

      if (!!url.match(/assets/)) {
        // serve any javascript or css files from here assets dir
        filePath = path.join('./',req.url);
      } else if (!!url.match(/\.css$|\/js\/|img/)) {
        // serve any javascript or css files from dist debug dir
        filePath = path.join(dist_dir,req.url);
      } else if (!!url.match(/\.js$|\.html$/)) {
        // server js from app directory
        console.log('js', req.url);
        filePath = path.join(app_dir,req.url.replace('/_utils/fauxton/app',''));
      } else if (url === '/' && accept[0] !== 'application/json') {
        // serve main index file from here
        filePath = path.join(dist_dir, 'index.html');
      };

      if (filePath) {
        return send(req, filePath).pipe(res);
      } 

      proxy.proxyRequest(req, res);
    }).listen(port);

    // Fail this task if any errors have been logged
    if (grunt.errors) {
      return false;
    }

    var watch = grunt.util.spawn({cmd: 'bbb', grunt: true, args: ['watch']}, function (error, result, code) {/* log.writeln(String(result));*/ });

    watch.stdout.pipe(process.stdout);
    watch.stderr.pipe(process.stderr);

    log.writeln('Listening on ' + port);
  });

};
