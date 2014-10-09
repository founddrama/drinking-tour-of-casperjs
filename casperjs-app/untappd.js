var casper      = require('casper').create(),
    credentials = require('./credentials'),
    filename    = casper.cli.args[0] || 'beers.csv',
    UNTAPPD     = 'https://untappd.com';

// in which we get all the beers
// in which we assume `$` == `jQuery` already on this page
function collectBeers(UNTAPPD) {
  var beers = [],
      items = $('.beer-item'),
      rx    = /([\d\.]+)/;

  function getNumber($el) {
    var result = rx.exec($el.text().trim());

    if (result) return Number(result[1]);
    else return '?';
  }

  items.each(function(i, el) {
    var $el  = $(el),
        beer = {
          'BID':            $el.data('bid'),
          'Name':           $el.find('.name').text().trim().replace(/,/g, ''),
          'Brewery':        $el.find('.brewery').text().trim().replace(/Company/g, 'Co.').replace(/,/g, ''),
          'Style':          $el.find('.style').text().trim(),
          'My Rating':      getNumber($el.find('.ratings .you p:contains("Your Rating")')),
          'Global Rating':  getNumber($el.find('.ratings .you p:contains("Global Rating")')),
          'ABV':            getNumber($el.find('.abv')),
          'IBU':            getNumber($el.find('.ibu')),
          'Checkins':       getNumber($el.find('.check-ins')),
          'First Checkin':  $el.find('.date:contains("First") a').text().trim(),
          'Latest Checkin': $el.find('.date:contains("Recent") a').text().trim(),
          'URL':            UNTAPPD + $el.find('.label').attr('href')
        };

    beers.push(beer);
  });

  return beers;
}

function beers2CSV(beers) {
  var keys = Object.keys(beers[0]);
      csv  = [keys.concat(['Notes'])];

  beers.forEach(function(b) {
    var beer = keys.map(function(k) {
      return b[k];
    }).concat('');

    csv.push(beer.join(','));
  });

  return csv.join('\n');
}

casper.start(UNTAPPD + '/login', function() {
  this.echo('Logging in...');
  this.fillSelectors('form', {
    '#username': credentials.username,
    '#password': credentials.password
  }, true);
});

casper.thenOpen(UNTAPPD + '/user/' + credentials.username + '/beers', function() {
  this.echo('Navigating to: ' + this.getCurrentUrl(), 'COMMENT');
});

casper.then(function() {
  this.echo(padRight('Retrieving beer data for ' + credentials.username + '...'), 'INFO_BAR');

  var MORE_BEERS_SELECTOR = '.button.more_beers',
      LOADING_ICON = '.stream-loading',
      counter = 0,

      getMoreBeers = function() {
        this.echo('Getting page ' + (++counter) + '...');
        this.click(MORE_BEERS_SELECTOR);
        this.waitUntilVisible(LOADING_ICON, hasLoadedAll, function() {
          this.log(LOADING_ICON + ' never appeared; didn\'t load?', 'error').exit();
        }, 500);
      }.bind(this),

      hasLoadedAll = function() {
        this.waitWhileVisible(LOADING_ICON, function() {
          if (this.visible(MORE_BEERS_SELECTOR)) {
            getMoreBeers();
          } else {
            this.echo('Evaluating page contents...');
            var allBeers = this.evaluate(collectBeers, UNTAPPD);

            require('fs').write(filename, beers2CSV(allBeers), 'w');

            this.echo(allDone(allBeers), 'GREEN_BAR').exit();
          }
        });
      }.bind(this);

  getMoreBeers();
});

casper.run();

function allDone(beers) {
  return padRight('All done! Wrote ' + beers.length + ' beers to ' + filename + '.');
}

function padRight(s) {
  while (s.length < 80) s += ' ';
  return s;
}