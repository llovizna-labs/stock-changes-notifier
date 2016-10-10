var request = require('request');
var async = require('async');
var _ = require('lodash');

// Payload Response
//{"text":"899988 : high,
//47.71081478 : vol,
//38341214.4411008 : vol_vef,
//801001 : buy,
//801002 : last,
//771000 : low,
//BTCVEF : pair,
//805000 : sell"}
//

var records = [];

var SLACK_URL = process.env.SLACK_URL;

var keys = {
  'high': '::',
  'low': '::',
  'vol': '::',
  'vol_vef': '::',
  'buy': '::',
  'sell': '::',
  'pair': '::'
};

function difference(last, current) {

  console.log('last sell', last.sell);
  console.log('last buy', last.buy);
  console.log('current sell', current.sell);
  console.log('current buy', current.buy);

  if (last.buy != current.buy ||
    last.sell != current.sell) {
    return true;
  }
  return false;
}

var requestLoop = setInterval(function() {

  async.waterfall([
    function(callback) {
      request.get({
        url: 'https://api.blinktrade.com/api/v1/VEF/ticker?crypto_currency=BTC',
        'Content-type': 'application/json'
      }, function(err, resp) {
        if (err) return callback(err);
        callback(null, resp);
      });
    },
    function(data, callback) {

      var ob = JSON.parse(data.body);
      if (records.length > 1) {
        var isNew = difference(records[records.length - 2], ob);
        if (!isNew && records.length != 1) {
          return callback(null, ob);
        }
      }

      var text = _.map(ob, function(value, key) {
        return _.join([key, ":", value], " ");
      });


      request.post({
        url: SLACK_URL,
        'Content-type': 'application/json',
        json: {
          "response_type": "ephemeral",
          "text": "Here are the current exchange for BTCVEF",
          "attachments": [{
            "text": _.join(text, " \n")
          }]
        }
      }, function(err, resp) {
        if (err) return callback(err);
        callback(null, resp);
        console.log('sent to slack');

      });
    }
  ], function(err, results) {
    if (err) console.log(err);

  });
}, 30000)
