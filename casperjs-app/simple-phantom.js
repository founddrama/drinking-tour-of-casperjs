var webpage = require('webpage').create();

webpage.open('https://untappd.com/user/founddrama', function(status) {
  if (status === 'fail') {
    console.error('Failed to open requested page.');
    phantom.exit(1);
  }

  var title = webpage.evaluate(function(selector) {
    return document.querySelector(selector).innerHTML;
  }, 'title');

  console.log('Title is: "' + title + '"');
  phantom.exit();
});