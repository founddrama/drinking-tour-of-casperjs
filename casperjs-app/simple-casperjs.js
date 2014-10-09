var casper = require('casper').create();

casper.start('https://untappd.com/user/founddrama', function() {
  this.echo('The title: "' + this.getHTML('title') + '"');
});

casper.run();