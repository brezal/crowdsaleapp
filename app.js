var fs = require('fs');
var http = require('http');
var express = require('express');
var postmark = require('postmark')(process.env.POSTMARK_API_TOKEN);
var stormpathRaw = require('stormpath');
var stormpath = require('express-stormpath');
var cookieParser = require('cookie-parser');
//var keythereum = require("keythereum");

var crypto = require('crypto');
var qrcode = require('yaqrcode');
var forms = require('forms');
var collectFormErrors = require('express-stormpath/lib/helpers').collectFormErrors;
var extend = require('xtend');
var shortid = require('shortid');
var augur = require('augur.js');

var blockchain = require('blockchain.info');
var blockexplorer = blockchain.blockexplorer;
var receive = new blockchain.Receive('https://sale.augur.net/blockchain');

var HOST_BTC_ADDRESS = '3N6S9PLVizPuf8nZkhVzp11PKhTiuTVE6R';
var PROD_HOST = 'sale.augur.net';

var app = module.exports = express();

app.set('views', './views');
app.set('view engine', 'jade');

app.use(cookieParser());

augur.options.BigNumberOnly = false;
augur.connect("http://eth2.augur.net");

var ethSaleContract = '0xe28e72fcf78647adce1f1252f240bbfaebd63bcc';

function getTotalEtherReceived() {
  var totalEther = augur.invoke({
    method: 'getFundsRaised',
    returns: 'number',
    to: ethSaleContract,
    from: augur.coinbase
  });
  if (totalEther) {
    return augur.numeric.bignum(totalEther).dividedBy(augur.constants.ETHER).toNumber();
  }
}

function getAmountEtherSent(address) {
  var amountSent = augur.invoke({
    method: 'getAmountSent',
    returns: 'number',
    to: ethSaleContract,
    from: augur.coinbase,
    signature: 'i',
    params: [ augur.numeric.prefix_hex(address) ]
  });
  if (amountSent) {
    return augur.numeric.bignum(amountSent).dividedBy(augur.constants.ETHER).toNumber();
  }
}

function getPercentageEtherSent(address) {
  return Math.round(100 * getAmountEtherSent(address) / getTotalEtherReceived());
}

// Get ETH/BTC and BTC/USD exchange rates from cryptocoincharts.info API:
// http://api.cryptocoincharts.info/tradingPair

var exchangeRate = 0;
var exchangeRateFile = 'eth_btc.txt';

http.request({
  host: 'api.cryptocoincharts.info',
  path: '/tradingPair/eth_btc'
}, function (response) {
  var str = '';

  // chunk of data recieved
  response.on('data', function (chunk) {
    str += chunk;
  });

  // whole response recieved
  response.on('end', function () {
    if (str) {
      try {
        exchangeRate = Number(JSON.parse(str).price);
        fs.writeFile(exchangeRateFile, exchangeRate, function (ex) {
          if (ex) console.error(ex);
        });
      } catch (ex) {
        console.log(
          "Error: couldn't fetch exchange rate from cryptocoincharts.info, "+
          "using stored exchange rate (" + exchangeRateFile + ") instead."
        );
        fs.readFile(exchangeRateFile, function (ex, data) {
          if (ex) console.error(ex);
          exchangeRate = Number(data.toString());
        });
      }
    }
  });
}).end();

var btcUsdExchangeRate = 0;
var btcUsdExchangeRateFile = 'btc_usd.txt';

http.request({
  host: 'api.cryptocoincharts.info',
  path: '/tradingPair/btc_usd'
}, function (response) {
  var str = '';

  response.on('data', function (chunk) {
    str += chunk;
  });

  response.on('end', function () {
    if (str) {
      try {
        btcUsdExchangeRate = Number(JSON.parse(str).price);
        fs.writeFile(btcUsdExchangeRateFile, btcUsdExchangeRate, function (ex) {
          if (ex) console.error(ex);
        });
      } catch (ex) {
        console.log(
          "Error: couldn't fetch exchange rate from cryptocoincharts.info, "+
          "using stored exchange rate (" + btcUsdExchangeRateFile + ") instead."
        );
        fs.readFile(btcUsdExchangeRateFile, function (ex, data) {
          if (ex) console.error(ex);
          btcUsdExchangeRate = Number(data.toString());
        });
      }
    }
  });
}).end();

// setup stormpath
app.use(stormpath.init(app, {

  apiKeyId: process.env.STORMPATHID,
  apiKeySecret: process.env.STORMPATHSECRET,
  application: 'https://api.stormpath.com/v1/applications/62cfhD5ihSuFHvjaZ1DxI3',
  secretKey: process.env.APPSECRET,
  expandCustomData: true,
  loginView: __dirname + '/views/stormpath/login.jade',
  redirectUrl: '/',
  cacheTTL: 1,
  cacheTTI: 1,
  enableUsername: true,
  requireUsername: true,
  enableForgotPassword: true,
  enableGoogle: true,
  enableFacebook: true,
  social: {
    facebook: {
      appId: process.env.FBID,
      appSecret: process.env.FBSECRET,
    },
    google: {
      clientId: process.env.GOOGLEID,
      clientSecret: process.env.GOOGLESECRET,
    },
  },
  templateContext: {
    csrf_token: createToken(generateSalt(10), process.env.CSRFSALT),
  }
}));

// static handlers
app.use('/favicon.ico', express.static('static/favicon.ico'));
app.use('/terms.pdf', express.static('static/terms.pdf'));
app.use('/privacy.pdf', express.static('static/privacy.pdf'));
app.use('/presale_risk_disclosure.pdf', express.static('static/presale_risk_disclosure.pdf'));
app.use('/purchase_agreement.pdf', express.static('static/purchase_agreement.pdf'));
app.use(express.static('static'));

// add clef logic in
var clef = require('./clef');
clef(app);

var apiKey = new stormpathRaw.ApiKey(
  process.env.STORMPATHID,
  process.env.STORMPATHSECRET
);

var client = new stormpathRaw.Client({ apiKey: apiKey });

function eliminateDuplicates(arr) {
  var i,
      len=arr.length,
      out=[],
      obj={};

  for (i = 0; i < len; i++) {
    obj[arr[i]] = 0;
  }
  for (i in obj) {
    out.push(i);
  }
  return out;
}

app.post('/save-buyin-ether-address', function (req, res) {
  if (req && req.body) {
    var data = req.body;
    if (data && data.address && data.userhref) {

      client.getAccount(data.userhref, function (err, account) {
        if (err) console.error(err);

        account.getCustomData(function (err, customData) {
          if (err) console.error(err);
          if (!customData.buyinEthereumAddress) {
            customData.buyinEthereumAddress = [];
          }
          if (customData.buyinEthereumAddress &&
              customData.buyinEthereumAddress.constructor !== Array)
          {
            customData.buyinEthereumAddress = [customData.buyinEthereumAddress];
          }
          var newAddress = augur.numeric.prefix_hex(data.address);
          customData.buyinEthereumAddress.push(newAddress);
          customData.buyinEthereumAddress = eliminateDuplicates(customData.buyinEthereumAddress);
          var etherSent = getAmountEtherSent(newAddress);

          customData.save(function (err) {
            if (err) console.error(err);

            blockexplorer.getAddress(process.env.BLOCKCHAIN, HOST_BTC_ADDRESS, function (err, data) {
              if (err) console.error(err);
              if (data) {
                var btcInfo = {
                  total: (data.total_received) / 100000000,
                  balance: customData.balance / 100000000
                };
                var ethInfo = { total: getTotalEtherReceived(), balance: 0 };
                if (customData.buyinEthereumAddress) {
                  for (var i = 0, len = customData.buyinEthereumAddress.length; i < len; ++i) {
                    var thisAddrBal = getAmountEtherSent(customData.buyinEthereumAddress[i]);
                    if (!isNaN(thisAddrBal)) ethInfo.balance += thisAddrBal;
                  }
                  if (isNaN(ethInfo.balance)) ethInfo.balance = 0;
                }
                var repPercentage = calculateRepPercentage(btcInfo, ethInfo, exchangeRate);
                res.end(JSON.stringify({
                  repAmount: (repPercentage * 8800000).toFixed(8),
                  repPercentage: (repPercentage * 100).toFixed(8),
                  ethBalance: ethInfo.balance
                }));
              }
            });
          });
        });
      });
    }
  }
});

app.post('/save-receiving-ether-address', function (req) {
  if (req && req.body) {
    var data = req.body;
    if (data && data.address && data.userhref) {

      client.getAccount(data.userhref, function (err, account) {
        if (err) console.error(err);

        account.getCustomData(function (err, customData) {
          if (err) console.error(err);
          customData.ethereumAddress = data.address;
          customData.save(function (err) {
            if (err) console.error(err);
          });
        });
      });
    }
  }
});

// redirect production site to secure version
app.get('*', function(req,res,next) {

  if (req.headers['x-forwarded-proto'] != 'https' && req.get('host') == PROD_HOST) {

    res.redirect('https://' + PROD_HOST + req.url);

  } else {

    next();   // continue to other routes if we're not redirecting
  }
});

// main view
app.get('/', function(req, res) {

  if (!req.user) {

    var totalEther = getTotalEtherReceived();
    if (totalEther) totalEther = +(totalEther.toPrecision(10));

    res.render('home', {
      totalEther: totalEther,
      ethBtcExchangeRate: exchangeRate,
      btcUsdExchangeRate: btcUsdExchangeRate,
      csrf_token: createToken(generateSalt(10), process.env.CSRFSALT),
      saleStarted: getSaleStarted(req, res)
    });

  } else {

    // get a unique btc address if we have not already
    if (req.user.customData.btcAddress) {
      userView(req, res);
    } else {
      receive.create(HOST_BTC_ADDRESS, function(error, data) {
          userView(req, res, error, data);
      });
    }
  }
});

// email ethereum key
app.post('/email_key', function(req, res) {

  console.info('emailing key to user');
  var key = req.body.key;
  var address = req.body.address;
  var emailBody = req.user.fullName + ",\n\nThe encrypted private key for the new Ethereum account " + address + " you generated at sale.augur.net is attached to this email.\n\nThis key and the passphrase that protects it are VERY IMPORTANT.  All purchased REP will be associated with this Ethereum account and protected by this key.  Please take appropriate precautions to secure this key and its passphrase.\n\nThe Augur Team"

  postmark.send({

    "From": "admin@augur.net",
    "To": req.user.email,
    "Subject": "[Augur Sale] Your Ethereum account key",
    "TextBody": emailBody,
    "Attachments": [{
      "Content": new Buffer(key).toString('base64'),
      "Name": (("UTC--" + new Date().toISOString() + "--" + address) || 'ethereumKey'),
      "ContentType": "application/octet-stream"
    }]

  }, function(error, success) {

    if (error) {

      console.error("unable to send email: " + error.message);
      return;
    }
  });

});

// note: btc.total and btc.balance in BTC, not satoshis!
function calculateRepPercentage(btc, eth, exchangeRate) {
  return (eth.balance*exchangeRate + btc.balance) / (eth.total*exchangeRate + btc.total);
}

app.post('/', function(req, res) {

  // no user, render home
  if (!req.user) {

    res.render('home', {
      csrf_token: createToken(generateSalt(10), process.env.CSRFSALT),
      saleStarted: getSaleStarted(req, res)
    });

  // save manual ethereum address
  } else if (req.body.ethereumAddress) {

    var ethereumAddress = req.body.ethereumAddress;

    // valid address format
    var validFormat = ethereumAddress.match(/^0x[a-fA-F0-9][40]$/);
    console.log(validFormat);

    req.user.customData.ethereumAddress = ethereumAddress;
    req.user.save(function(err) {
      if (err) {
        if (err.developerMessage) {
          console.error(err);
        }
      }
    });
    userView(req, res);
  }
});

// get all user data, balances, etc.
function userView(req, res, error, data) {

  // the express-stormpath library will populate req.user,
  // all we have to do is set the properties that we care
  // about and then call save(s) on the user object.

  var btcAddress = req.user.customData.btcAddress;
  var btcBalance = 0;
  var repPercentage = 0;

  var augurBalance, buyUri, unconfirmedBtc;

  if (btcAddress) {

    // do nothing, address already exists
    buyUri = 'bitcoin:' + req.user.customData.btcAddress + '?label=Augur';

  } else {

    if (!data) {

      res.redirect('/');  // if there's no data, is there an error and should we go to an error page instead?

    } else {

      btcAddress = data.input_address;
      uri = 'bitcoin:' + btcAddress + '?label=Augur';
      buyUri = uri;

      req.user.customData.btcAddress = btcAddress;
      req.user.save(function(err) { if (err) console.error(err) });
    }
  }

  blockexplorer.getAddress(process.env.BLOCKCHAIN, btcAddress, function(error, data) {

    if (data) {

      btcBalance = data.total_received;
      unconfirmedBtc = data.final_balance;

      if (req.user.customData.balance < btcBalance || !req.user.customData.balance) {

        req.user.customData.balance = btcBalance;
        req.user.save(function(err) { if (err) console.error(err) });
      }

      if (data.txs[0]) {
        time = data.txs[0].time;
        if (!req.user.customData.time) {
          req.user.customData.time = time;
          req.user.save(function(err) { if (err) console.error(err) });
        }
      }

      if (!req.user.customData.referralCode) {
        req.user.customData.referralCode = req.user.email + shortid.generate();
        req.user.save(function(err) {
          if (err) {
            console.error(err);
          }
        });
      }

      blockexplorer.getAddress(process.env.BLOCKCHAIN, HOST_BTC_ADDRESS, function(error, data) {
        if (error) console.error(error);

        if (data) {
          augurBalance = data.total_received + unconfirmedBtc;
        }

        if (augurBalance) {

          var btcInfo = {
            total: augurBalance / 100000000,
            balance: req.user.customData.balance / 100000000
          };

          var ethInfo = { total: getTotalEtherReceived(), balance: 0 };

          if (req.user.customData.buyinEthereumAddress) {
            if (req.user.customData.buyinEthereumAddress.constructor !== Array) {
              req.user.customData.buyinEthereumAddress = [req.user.customData.buyinEthereumAddress];
            }
            req.user.customData.buyinEthereumAddress = eliminateDuplicates(req.user.customData.buyinEthereumAddress);
            for (var i = 0, len = req.user.customData.buyinEthereumAddress.length; i < len; ++i) {
              var thisAddrBal = getAmountEtherSent(req.user.customData.buyinEthereumAddress[i]);
              if (!isNaN(thisAddrBal)) ethInfo.balance += thisAddrBal;
            }
            if (isNaN(ethInfo.balance)) ethInfo.balance = 0;
          }

          repPercentage = calculateRepPercentage(btcInfo, ethInfo, exchangeRate);

          // will need to push to remove this cose after sale done
          var btcRepPercentage = req.user.customData.balance / augurBalance;
          if (req.user.customData.repPercentage < repPercentage || !req.user.customData.repPercentage) {
            req.user.customData.repPercentage = repPercentage;
            req.user.save(function(err) { if (err) console.error(err) });
          }

          // check cookie for referrer id and save to user object if it hasn't been
          if (!req.user.customData.personWhoReferred && req.cookies['ref-id']) {

            // only save the referral code if it isn't the users
            if (req.cookies['ref-id'] !== req.user.customData.referralCode) {

              console.log('saving referrer id', req.cookies['ref-id']);

              req.user.customData.personWhoReferred = req.cookies['ref-id'];
              req.user.save(function(err) { if (err) console.error(err) });
            }
          }

          if (ethInfo.total) ethInfo.total = ethInfo.total.toPrecision(10);

          // console.log(JSON.stringify(req.user.customData.buyinEthereumAddress));

          res.render('home', {

            referralLink: false,
            csrf_token: createToken(generateSalt(10), process.env.CSRFSALT),
            ethereumAddress: req.user.customData.ethereumAddress,
            buyinEthereumAddress: JSON.stringify(req.user.customData.buyinEthereumAddress),
            userEmail: req.user.email,
            btcBalance: btcInfo.balance,
            btcAddress: btcAddress,
            referralCode: req.user.customData.referralCode,
            repPercentage: (req.user.customData.repPercentage * 100).toFixed(8),
            repAmount: (req.user.customData.repPercentage * 8800000).toFixed(8),
            totalEther: ethInfo.total,
            ethBalance: ethInfo.balance,
            ethBtcExchangeRate: exchangeRate,
            btcUsdExchangeRate: btcUsdExchangeRate,
            buyUri: buyUri,
            qrCode: qrcode(buyUri),
            saleStarted: getSaleStarted(req, res)
          });
        }
      });
    }
  });
}

app.get('/ref*', function(req, res) {

  res.cookie('ref-id', req.query.id, { maxAge: 9000000, httpOnly: true });

  res.redirect(req.protocol + '://' + req.get('host'));
});

app.get('/blockchain', function(req, res) {

  res.send("*ok*");
});


function getSaleStarted(req, res) {

  if (req.query.forceSaleStarted || req.cookies.forceSaleStarted) {

    if (!req.cookies.forceSaleStarted) res.cookie('forceSaleStarted', '1');
    return true;
  }

  var saleDate = new Date(Date.UTC(2015, 07, 17, 16, 00, 00));
  var now = new Date();

  return now > saleDate;
}

function createToken(salt, secret) {

  return salt + crypto
    .createHash('sha1')
    .update(salt + secret)
    .digest('base64');
}

function generateSalt(length) {

  var SALTCHARS = process.env.SALTCHARS;
  var i, r = [];

  for (i = 0; i < length; ++i) {
    r.push(SALTCHARS[Math.floor(Math.random() * SALTCHARS.length)]);
  }
  return r.join('');
}

app.listen(process.env.PORT || 3000);

module.exports = router
module.exports = stormpath
