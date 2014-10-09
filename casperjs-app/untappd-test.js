var credentials = require('./credentials'),
    UNTAPPD     = 'https://untappd.com';

casper.test.begin('Untappd.com demo test thing', function(test) {
  casper
    .start(UNTAPPD + '/login', function() {
      test.assertExists('#username');
      test.assertExists('#password');

      this.fillSelectors('form', {
        '#username': credentials.username,
        '#password': credentials.password
      }, true);
    })
    .thenOpen(UNTAPPD + '/user/' + credentials.username + '/beers', function() {
      test.assertUrlMatch(new RegExp(credentials.username + '/beers$', 'i'),
          'Current URL ends with ' + credentials.username + '/beers');
      test.assertSelectorDoesntHaveText('.info h1', 'Friesel');
      test.assertSelectorHasText('.info .username', credentials.username);
      test.assertTextExists('La Fin Du Monde',
          '"La Fin Du Monde" is on the recent beer history');
    })
    .run(function() {
      test.done();
    });
});