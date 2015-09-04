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
var ipfilter = require('express-ipfilter');

var blockchain = require('blockchain.info');
var blockexplorer = blockchain.blockexplorer;
var receive = new blockchain.Receive('https://sale.augur.net/blockchain');

var HOST_BTC_ADDRESS = '3N6S9PLVizPuf8nZkhVzp11PKhTiuTVE6R';
var PROD_HOST = 'sale.augur.net';

var app = module.exports = express();

app.set('views', './views');
app.set('view engine', 'jade');

app.use(cookieParser());

var ips = ['5.101.221.128/25','41.194.23.160/28','57.91.32.0/20','62.208.137.0/24','104.250.179.0/24','152.206.0.0/15','169.158.0.0/16','181.225.224.0/19','190.6.64.0/19','190.15.144.0/20','190.92.112.0/22','190.92.116.0/26','190.92.116.64/27','190.92.116.104/29','190.92.116.112/28','190.92.116.128/25','190.92.117.0/24','190.92.118.0/23','190.92.120.0/21','190.107.0.0/20','194.117.119.75/32','196.1.112.0/24','196.1.135.0/24','196.3.152.0/24','200.0.16.0/24','200.0.24.0/22','200.5.12.0/22','200.13.144.0/21','200.14.48.0/21','200.55.128.0/19','200.55.160.0/20','200.55.176.0/23','200.55.178.0/26','200.55.178.64/28','200.55.178.80/29','200.55.178.96/27','200.55.178.128/25','200.55.179.0/24','200.55.180.0/22','200.55.184.0/23','200.55.186.0/24','200.55.187.0/25','200.55.187.128/27','200.55.187.160/29','200.55.187.176/28','200.55.187.192/26','200.55.188.0/22','201.220.192.0/19','212.63.180.60/30','2.144.0.0/14','2.176.0.0/14','2.180.0.0/19','2.180.32.0/21','2.180.40.0/22','2.180.44.0/23','2.180.47.0/24','2.180.48.0/20','2.180.64.0/18','2.180.128.0/17','2.181.0.0/16','2.182.0.0/15','2.184.0.0/17','2.184.128.0/18','2.184.192.0/20','2.184.208.0/22','2.184.212.0/23','2.184.214.0/24','2.184.216.0/21','2.184.224.0/19','2.185.0.0/17','2.185.128.0/19','2.185.160.0/20','2.185.176.0/21','2.185.184.0/23','2.185.186.0/24','2.185.188.0/22','2.185.192.0/18','2.186.0.0/15','2.188.0.0/14','2.236.16.0/24','5.22.0.0/17','5.22.192.0/19','5.23.112.0/21','5.28.32.0/21','5.34.192.0/19','5.52.0.0/16','5.53.32.0/19','5.56.128.0/22','5.56.132.0/24','5.56.135.0/24','5.57.32.0/21','5.61.24.0/23','5.61.26.0/24','5.61.29.0/24','5.61.30.0/23','5.61.72.0/21','5.63.8.0/21','5.78.0.0/16','5.102.32.0/20','5.106.0.0/16','5.112.0.0/13','5.120.0.0/14','5.124.0.0/15','5.126.0.0/17','5.126.128.0/18','5.126.193.0/24','5.126.194.0/23','5.126.196.0/22','5.126.200.0/21','5.126.208.0/20','5.126.224.0/19','5.127.0.0/16','5.134.128.0/18','5.144.128.0/21','5.145.112.0/21','5.159.48.0/21','5.160.0.0/15','5.189.204.0/25','5.190.0.0/16','5.198.160.0/19','5.200.64.0/18','5.200.128.0/17','5.201.128.0/17','5.202.0.0/16','5.208.0.0/12','5.226.48.0/21','5.232.0.0/13','5.250.0.0/17','23.202.163.0/24','31.2.128.0/17','31.7.64.0/18','31.7.128.0/20','31.14.80.0/20','31.14.112.0/20','31.14.144.0/20','31.24.204.0/22','31.24.232.0/21','31.25.88.0/21','31.25.104.0/21','31.25.128.0/21','31.25.232.0/21','31.29.32.0/19','31.40.0.0/21','31.47.32.0/19','31.56.0.0/14','31.130.176.0/20','31.170.48.0/20','31.171.216.0/21','31.184.128.0/18','31.193.112.0/21','31.193.144.0/20','31.217.208.0/21','37.9.248.0/21','37.19.80.0/20','37.27.0.0/16','37.32.0.0/19','37.32.32.0/20','37.32.112.0/20','37.44.56.0/21','37.49.144.0/21','37.63.128.0/17','37.75.240.0/21','37.98.0.0/17','37.98.200.0/21','37.114.192.0/18','37.123.192.0/21','37.128.240.0/20','37.129.0.0/16','37.130.200.0/21','37.137.0.0/16','37.143.144.0/21','37.152.160.0/19','37.153.128.0/22','37.153.176.0/20','37.156.16.0/20','37.156.48.0/20','37.156.112.0/20','37.156.128.0/20','37.156.152.0/21','37.156.160.0/21','37.156.176.0/22','37.191.64.0/19','37.221.0.0/18','37.235.16.0/20','37.254.0.0/16','37.255.0.0/18','37.255.64.0/20','37.255.80.0/23','37.255.83.0/24','37.255.84.0/22','37.255.88.0/21','37.255.96.0/19','37.255.128.0/17','38.99.79.0/24','39.41.250.0/24','46.18.248.0/21','46.21.80.0/20','46.28.72.0/21','46.32.0.0/19','46.34.96.0/19','46.34.160.0/19','46.36.96.0/19','46.38.128.0/19','46.41.192.0/18','46.51.0.0/17','46.62.128.0/17','46.100.0.0/16','46.102.120.0/21','46.102.128.0/20','46.102.184.0/22','46.143.0.0/16','46.148.32.0/20','46.164.64.0/18','46.209.0.0/16','46.224.0.0/15','46.245.0.0/17','46.248.32.0/19','46.249.96.0/24','46.249.98.0/23','46.249.100.0/22','46.249.104.0/22','46.249.112.0/23','46.249.120.0/21','46.251.160.0/19','46.255.216.0/21','57.88.80.0/20','62.32.49.128/26','62.32.49.192/27','62.32.49.224/29','62.32.49.240/28','62.32.50.0/24','62.32.53.64/26','62.32.53.168/29','62.32.53.224/28','62.32.61.96/27','62.32.61.224/27','62.32.63.128/26','62.60.128.0/17','62.102.128.0/20','62.145.92.128/25','62.145.109.0/24','62.193.0.0/19','62.220.96.0/19','63.243.185.0/24','64.214.116.16/32','67.16.178.147/32','67.16.178.148/31','67.16.178.150/32','77.36.128.0/17','77.77.64.0/18','77.81.32.0/20','77.81.76.0/22','77.81.80.0/22','77.81.128.0/21','77.81.144.0/20','77.81.192.0/19','77.95.219.0/24','77.95.220.0/24','77.104.64.0/18','77.237.64.0/19','77.237.160.0/19','77.245.224.0/20','78.38.0.0/18','78.38.64.0/21','78.38.72.0/22','78.38.76.0/23','78.38.78.0/24','78.38.79.0/27','78.38.79.32/28','78.38.79.64/26','78.38.79.128/25','78.38.80.0/20','78.38.96.0/19','78.38.128.0/17','78.39.0.0/17','78.39.128.0/20','78.39.144.0/22','78.39.148.0/23','78.39.150.16/28','78.39.150.32/27','78.39.150.64/26','78.39.150.128/25','78.39.151.0/24','78.39.152.0/21','78.39.160.0/19','78.39.192.0/18','78.109.192.0/20','78.110.112.0/20','78.111.0.0/20','78.154.32.0/19','78.157.32.0/19','78.158.160.0/19','79.107.127.0/24','79.127.0.0/17','79.132.192.0/19','79.143.84.0/23','79.174.160.0/21','79.175.128.0/19','79.175.160.0/22','79.175.164.0/23','79.175.166.0/24','79.175.167.0/25','79.175.167.128/30','79.175.167.132/31','79.175.167.144/28','79.175.167.160/27','79.175.167.192/26','79.175.168.0/22','79.175.172.0/25','79.175.172.128/26','79.175.173.0/24','79.175.174.0/23','79.175.176.0/20','80.66.176.0/20','80.69.240.0/20','80.71.112.0/20','80.75.0.0/20','80.191.0.0/16','80.231.68.0/24','80.242.0.0/20','80.250.192.0/20','80.253.128.0/19','80.255.3.160/27','81.12.0.0/17','81.28.32.0/19','81.29.240.0/20','81.31.160.0/19','81.31.224.0/19','81.90.144.0/20','81.91.128.0/19','81.163.0.0/21','82.99.192.0/18','82.115.0.0/21','82.115.8.0/22','82.115.12.0/23','82.115.14.0/24','82.115.16.0/22','82.115.20.0/23','82.115.29.0/24','82.115.30.0/23','82.138.140.0/25','83.120.0.0/14','83.147.192.0/18','83.170.26.0/24','83.170.34.96/27','83.170.34.160/27','83.170.34.192/27','84.17.168.32/27','84.39.176.0/21','84.47.208.0/23','84.47.210.0/24','84.47.212.0/22','84.47.216.0/21','84.47.224.0/20','84.47.248.0/21','84.233.149.241/32','84.241.0.0/18','84.246.71.128/28','84.246.71.168/29','84.246.71.176/32','85.9.64.0/18','85.15.0.0/18','85.133.128.0/17','85.185.0.0/16','85.198.0.0/18','85.204.30.0/23','85.204.76.0/23','85.204.80.0/20','85.204.104.0/23','85.204.128.0/22','85.204.208.0/20','85.239.192.0/19','86.55.0.0/16','86.57.0.0/17','86.104.32.0/20','86.104.80.0/20','86.104.96.0/20','86.104.232.0/21','86.104.240.0/21','86.105.40.0/21','86.105.128.0/20','86.106.24.0/23','86.106.192.0/21','86.107.0.0/20','86.107.80.0/20','86.107.144.0/20','86.107.208.0/20','86.109.32.0/19','87.107.0.0/16','87.247.160.0/19','87.248.128.0/19','88.135.32.0/20','89.32.0.0/19','89.32.96.0/20','89.32.196.0/23','89.33.18.0/23','89.33.128.0/23','89.33.204.0/23','89.33.234.0/23','89.33.240.0/23','89.34.20.0/23','89.34.32.0/19','89.34.88.0/23','89.34.94.0/23','89.34.128.0/19','89.34.168.0/23','89.34.176.0/23','89.34.200.0/23','89.34.248.0/21','89.35.58.0/23','89.35.64.0/21','89.35.132.0/23','89.35.156.0/23','89.35.176.0/23','89.35.194.0/23','89.36.16.0/23','89.36.48.0/20','89.36.96.0/20','89.36.176.0/20','89.36.194.0/23','89.36.226.0/23','89.36.252.0/23','89.37.0.0/20','89.37.30.0/23','89.37.42.0/23','89.37.102.0/23','89.37.144.0/21','89.37.198.0/23','89.37.218.0/23','89.37.240.0/20','89.38.24.0/23','89.38.80.0/20','89.38.102.0/23','89.38.184.0/21','89.38.192.0/21','89.38.212.0/22','89.38.242.0/23','89.39.186.0/23','89.40.38.0/23','89.40.78.0/23','89.40.90.0/23','89.40.106.0/23','89.40.110.0/23','89.40.128.0/23','89.40.152.0/21','89.40.240.0/20','89.41.8.0/21','89.41.16.0/21','89.41.32.0/23','89.41.58.0/23','89.41.184.0/22','89.41.192.0/19','89.41.224.0/20','89.41.240.0/21','89.42.32.0/23','89.42.44.0/22','89.42.56.0/23','89.42.68.0/23','89.42.96.0/21','89.42.136.0/22','89.42.150.0/23','89.42.184.0/21','89.42.196.0/22','89.42.228.0/23','89.43.0.0/20','89.43.36.0/23','89.43.70.0/23','89.43.88.0/21','89.43.96.0/21','89.43.182.0/23','89.43.188.0/23','89.43.204.0/23','89.43.216.0/21','89.43.224.0/21','89.44.112.0/23','89.44.118.0/23','89.44.128.0/21','89.44.146.0/23','89.44.176.0/21','89.44.190.0/23','89.44.202.0/23','89.44.240.0/22','89.45.48.0/20','89.45.68.0/23','89.45.80.0/23','89.45.112.0/21','89.45.126.0/23','89.45.152.0/21','89.45.230.0/23','89.46.44.0/23','89.46.60.0/23','89.46.94.0/23','89.46.216.0/22','89.47.64.0/20','89.47.128.0/19','89.47.196.0/22','89.47.200.0/22','89.144.57.31/32','89.144.57.32/28','89.144.128.0/18','89.165.0.0/17','89.184.192.0/19','89.196.0.0/16','89.198.0.0/15','89.219.64.0/18','89.219.192.0/18','89.221.80.0/20','89.235.64.0/18','91.98.0.0/17','91.98.128.0/21','91.98.136.0/22','91.98.141.0/24','91.98.142.0/23','91.98.144.0/20','91.98.160.0/19','91.98.192.0/18','91.99.0.0/16','91.106.64.0/19','91.108.128.0/19','91.133.128.0/17','91.184.64.0/19','91.185.128.0/19','91.186.192.0/19','91.206.122.0/23','91.207.138.0/23','91.208.165.0/24','91.209.242.0/24','91.212.16.0/24','91.212.252.0/24','91.216.4.0/24','91.217.64.0/23','91.220.79.0/24','91.222.196.0/22','91.224.110.0/23','91.224.176.0/23','91.225.52.0/22','91.226.224.0/23','91.228.189.0/24','91.229.214.0/23','91.230.32.0/24','91.232.64.0/22','91.232.68.0/23','91.232.72.0/22','91.233.56.0/22','91.236.168.0/23','91.237.254.0/23','91.238.0.0/24','91.239.14.0/24','91.239.54.0/23','91.239.108.0/22','91.239.214.0/24','91.240.60.0/22','91.240.180.0/22','91.241.20.0/23','91.241.92.0/24','91.242.44.0/23','91.243.126.0/23','91.243.160.0/20','91.247.66.0/23','91.251.0.0/16','92.42.48.0/21','92.50.0.0/18','92.61.176.0/20','92.62.176.0/20','92.114.16.0/20','92.114.48.0/22','92.242.192.0/19','93.110.0.0/16','93.113.224.0/20','93.114.16.0/20','93.117.0.0/19','93.117.32.0/20','93.117.96.0/19','93.117.176.0/20','93.118.96.0/19','93.118.128.0/19','93.118.160.0/20','93.119.32.0/19','93.119.64.0/19','93.119.208.0/20','93.126.0.0/18','93.170.24.0/24','93.190.24.0/21','94.24.0.0/20','94.24.16.0/21','94.24.80.0/20','94.24.96.0/21','94.46.117.10/32','94.74.128.0/18','94.101.128.0/20','94.101.176.0/20','94.101.240.0/20','94.139.160.0/19','94.176.8.0/21','94.176.16.0/20','94.176.32.0/21','94.176.48.0/20','94.176.80.0/20','94.177.72.0/21','94.182.0.0/15','94.184.0.0/16','94.232.168.0/21','94.241.128.0/20','94.241.144.0/22','94.241.152.0/21','94.241.160.0/19','95.38.0.0/16','95.64.0.0/17','95.80.128.0/18','95.81.64.0/18','95.82.0.0/17','95.130.56.0/21','95.130.240.0/21','95.142.224.0/20','95.162.0.0/17','95.162.128.0/18','95.162.192.0/19','95.162.228.0/24','95.162.232.0/21','95.162.240.0/20','95.215.160.0/22','95.215.173.0/24','103.231.137.0/24','103.231.138.0/24','104.237.225.0/24','109.72.192.0/20','109.74.224.0/20','109.95.56.0/21','109.95.64.0/21','109.108.160.0/19','109.109.32.0/19','109.110.160.0/19','109.111.32.0/22','109.111.39.0/24','109.111.40.0/21','109.111.48.0/20','109.122.192.0/18','109.125.128.0/18','109.162.128.0/17','109.201.0.0/19','109.203.128.0/18','109.225.128.0/18','109.230.64.0/18','109.238.176.0/20','109.239.0.0/20','128.65.160.0/19','128.140.0.0/17','130.185.72.0/21','130.244.79.126/32','130.255.192.0/18','146.66.128.0/23','151.216.36.0/22','151.232.0.0/14','151.238.0.0/19','151.238.32.0/23','151.238.34.0/24','151.238.36.0/22','151.238.40.0/21','151.238.48.0/20','151.238.64.0/18','151.238.128.0/17','151.239.0.0/16','151.240.0.0/14','151.244.0.0/15','151.246.0.0/17','151.246.128.0/18','151.246.192.0/20','151.246.208.0/21','151.246.216.0/24','151.246.218.0/23','151.246.220.0/22','151.246.224.0/19','151.247.0.0/16','158.58.0.0/17','158.58.184.0/21','159.20.96.0/20','159.255.32.0/21','162.223.90.0/24','164.138.16.0/21','164.138.128.0/18','164.215.40.0/21','164.215.56.0/21','164.215.128.0/17','173.237.208.200/29','176.12.64.0/20','176.46.128.0/19','176.56.144.0/20','176.62.144.0/21','176.67.64.0/20','176.101.32.0/20','176.101.48.0/21','176.102.224.0/19','176.110.108.0/22','176.122.210.0/23','176.123.64.0/18','176.124.64.0/22','176.221.16.0/20','176.221.64.0/21','178.21.40.0/21','178.21.160.0/21','178.22.72.0/22','178.22.76.0/23','178.131.0.0/16','178.157.0.0/18','178.173.128.0/17','178.215.0.0/18','178.219.224.0/20','178.236.32.0/20','178.238.192.0/20','178.239.144.0/20','178.248.40.0/21','178.251.208.0/21','178.252.128.0/18','178.253.32.0/22','178.253.48.0/20','185.2.12.0/22','185.3.124.0/22','185.3.200.0/22','185.3.212.0/22','185.4.0.0/22','185.4.16.0/22','185.4.28.0/22','185.4.104.0/22','185.4.220.0/22','185.5.156.0/22','185.8.172.0/23','185.8.174.0/32','185.10.72.0/22','185.11.68.0/22','185.11.88.0/22','185.11.176.0/22','185.12.60.0/22','185.12.100.0/22','185.13.228.0/22','185.14.80.0/22','185.14.160.0/22','185.16.232.0/22','185.18.212.0/22','185.20.160.0/22','185.21.68.0/22','185.21.76.0/22','185.22.28.0/22','185.23.128.0/22','185.24.136.0/22','185.24.148.0/22','185.24.228.0/22','185.24.252.0/22','185.26.32.0/22','185.26.208.0/22','185.26.232.0/22','185.29.220.0/22','185.30.4.0/22','185.30.76.0/22','185.31.124.0/22','185.32.128.0/22','185.34.160.0/22','185.36.192.0/22','185.37.52.0/22','185.39.180.0/22','185.40.224.0/22','185.40.240.0/22','185.41.0.0/22','185.42.24.0/22','185.42.212.0/22','185.42.224.0/22','185.44.36.0/22','185.44.64.0/22','185.44.100.0/22','185.44.112.0/22','185.45.188.0/22','185.46.0.0/22','185.46.108.0/22','185.46.216.0/22','185.47.48.0/22','185.49.84.0/22','185.49.96.0/22','185.49.104.0/22','185.50.37.0/24','185.50.38.0/23','185.51.40.0/22','185.51.200.0/22','185.55.224.0/22','185.56.92.0/22','185.56.96.0/22','185.57.132.0/22','185.57.164.0/22','185.57.200.0/22','185.58.240.0/22','185.59.112.0/22','185.60.32.0/22','185.60.136.0/22','185.62.232.0/22','185.63.236.0/22','185.64.176.0/22','185.66.224.0/21','185.67.12.0/22','185.67.100.0/22','185.67.212.0/22','185.69.108.0/22','185.69.120.0/22','185.70.60.0/22','185.70.196.0/22','185.71.152.0/22','185.71.192.0/22','185.72.24.0/22','185.73.0.0/22','185.73.76.0/22','185.73.114.0/23','185.74.164.0/22','185.75.196.0/22','185.75.204.0/22','185.76.248.0/22','185.78.20.0/22','185.78.104.0/22','185.79.60.0/22','185.79.96.0/22','185.79.156.0/22','185.80.196.0/22','185.81.40.0/22','185.81.96.0/22','185.82.28.0/22','185.82.64.0/22','185.82.136.0/22','185.82.164.0/22','185.82.180.0/22','185.83.28.0/22','185.83.72.0/21','185.83.80.0/22','185.83.88.0/22','185.83.112.0/22','185.83.180.0/22','185.83.184.0/22','185.83.196.0/22','185.83.200.0/22','185.83.208.0/22','185.84.160.0/22','185.84.220.0/22','185.85.68.0/22','185.85.136.0/22','185.85.210.0/23','185.86.36.0/22','185.86.180.0/22','185.87.180.0/22','185.88.48.0/22','185.88.152.0/22','185.88.176.0/22','185.88.252.0/22','185.89.112.0/22','185.92.4.0/22','185.92.8.0/22','185.92.40.0/22','185.93.164.0/22','185.94.96.0/32','185.94.96.9/32','185.94.96.10/31','185.94.96.12/30','185.94.96.16/28','185.94.96.32/27','185.94.96.64/26','185.94.96.128/25','185.94.97.0/24','185.94.99.0/24','185.95.60.0/22','185.95.152.0/22','185.95.180.0/22','185.96.240.0/22','185.97.116.0/22','185.98.112.0/22','185.99.212.0/22','185.100.44.0/22','185.101.228.0/22','185.103.84.0/22','185.103.128.0/22','185.103.244.0/23','185.103.248.0/24','185.104.192.0/22','185.104.228.0/22','185.105.184.0/22','185.105.236.0/22','185.106.136.0/22','185.106.228.0/22','185.107.32.0/22','185.107.244.0/22','185.107.248.0/22','185.108.96.0/22','185.109.60.0/22','185.109.72.0/22','185.109.80.0/22','185.109.128.0/22','185.109.244.0/22','185.109.248.0/22','185.110.28.0/22','185.110.216.0/22','185.110.228.0/22','185.110.236.0/22','185.110.244.0/22','185.110.252.0/22','185.111.8.0/21','185.111.40.0/22','185.111.64.0/22','185.111.128.0/22','185.111.136.0/22','185.112.32.0/21','185.112.128.0/22','185.112.148.0/22','185.112.168.0/22','185.113.56.0/22','185.113.104.0/22','185.113.112.0/22','185.113.148.0/22','185.113.152.0/22','188.34.0.0/16','188.75.64.0/18','188.93.64.0/21','188.118.64.0/18','188.121.96.0/19','188.121.128.0/19','188.122.96.0/19','188.126.128.0/19','188.136.128.0/17','188.158.0.0/15','188.191.176.0/21','188.208.64.0/19','188.208.144.0/20','188.208.160.0/19','188.208.224.0/19','188.209.8.0/21','188.209.16.0/20','188.209.32.0/20','188.209.64.0/20','188.209.116.0/22','188.209.128.0/18','188.209.192.0/20','188.210.64.0/20','188.210.96.0/19','188.210.128.0/18','188.210.192.0/20','188.211.0.0/20','188.211.32.0/19','188.211.64.0/18','188.211.128.0/19','188.211.176.0/20','188.211.192.0/19','188.212.6.0/23','188.212.48.0/20','188.212.64.0/19','188.212.96.0/22','188.212.160.0/19','188.212.208.0/20','188.212.224.0/20','188.212.240.0/21','188.213.64.0/20','188.213.96.0/19','188.213.144.0/20','188.213.176.0/20','188.213.192.0/21','188.214.4.0/22','188.214.64.0/20','188.214.84.0/22','188.214.120.0/23','188.214.160.0/19','188.214.232.0/21','188.215.24.0/22','188.215.88.0/22','188.215.128.0/20','188.215.160.0/19','188.215.192.0/19','188.229.0.0/17','188.240.196.0/24','188.240.212.0/24','188.245.0.0/16','188.253.0.0/17','192.30.80.0/24','193.0.156.0/24','193.8.139.0/24','193.19.144.0/23','193.28.181.0/24','193.32.80.0/23','193.35.62.0/24','193.104.22.0/24','193.104.212.0/24','193.105.2.0/24','193.105.6.0/24','193.142.30.0/24','193.151.128.0/19','193.178.200.0/22','193.189.122.0/23','193.222.51.0/24','193.242.194.0/23','193.242.208.0/23','194.33.104.0/22','194.33.122.0/23','194.33.124.0/22','194.60.228.0/22','194.77.208.66/32','194.143.140.0/23','194.146.148.0/22','194.225.0.0/18','194.225.64.0/19','194.225.96.0/20','194.225.112.0/21','194.225.121.0/24','194.225.122.0/23','194.225.124.0/22','194.225.128.0/17','195.10.15.160/28','195.20.136.0/24','195.27.14.0/28','195.88.188.0/23','195.96.139.16/28','195.110.38.0/23','195.146.32.0/19','195.170.163.0/24','195.191.74.0/23','195.211.44.0/22','195.213.219.0/28','195.219.71.0/24','195.245.70.0/23','196.3.91.0/24','204.245.22.24/30','204.245.22.29/32','204.245.22.30/31','208.48.251.249/32','209.28.123.0/26','210.5.196.64/26','210.5.197.64/26','210.5.198.32/29','210.5.198.64/28','210.5.198.96/27','210.5.198.128/26','210.5.198.192/27','210.5.204.0/25','210.5.205.0/26','210.5.208.0/26','210.5.208.128/25','210.5.209.0/25','210.5.214.192/26','210.5.218.64/26','210.5.218.128/25','210.5.232.0/25','210.5.233.0/25','210.5.233.128/26','212.1.192.0/21','212.6.37.0/24','212.6.38.0/24','212.6.41.0/25','212.6.42.0/24','212.6.45.0/24','212.6.47.0/24','212.6.50.0/24','212.16.64.0/24','212.16.67.0/24','212.16.68.0/24','212.16.70.0/23','212.16.72.0/21','212.16.80.0/20','212.33.192.0/19','212.50.224.0/19','212.80.0.0/20','212.80.16.0/21','212.80.24.0/22','212.80.28.0/24','212.80.30.0/23','212.86.64.0/19','212.95.128.0/19','212.120.192.0/19','213.109.240.0/20','213.147.128.0/19','213.176.0.0/17','213.195.0.0/18','213.207.192.0/18','213.217.32.0/19','213.233.160.0/19','216.55.163.116/30','216.55.163.120/30','217.11.16.0/20','217.24.146.0/24','217.25.48.0/20','217.64.144.0/20','217.66.192.0/19','217.146.208.0/20','217.161.16.0/23','217.170.240.0/20','217.171.191.220/30','217.172.96.0/22','217.172.104.0/21','217.172.112.0/22','217.172.120.0/21','217.174.16.0/20','217.218.0.0/15','57.73.224.0/19','90.201.243.0/24','94.46.53.18/32','175.45.176.0/22','5.0.0.0/16','5.104.128.0/21','5.134.200.0/21','5.134.224.0/19','5.155.0.0/16','31.9.0.0/16','31.193.64.0/20','37.48.128.0/18','37.48.192.0/19','45.40.53.136/29','46.53.0.0/17','46.57.128.0/17','46.58.128.0/17','46.161.192.0/18','46.213.0.0/16','46.243.145.0/24','57.88.224.0/20','63.243.163.0/24','66.198.39.0/24','66.198.41.0/24','67.16.140.142/32','67.16.172.127/32','67.16.180.162/32','67.16.180.166/32','67.17.66.94/32','77.44.128.0/17','78.110.96.0/20','78.155.64.0/19','82.116.129.0/24','82.137.192.0/18','83.229.27.216/29','88.86.0.0/19','89.211.95.0/24','90.153.128.0/17','91.144.0.0/18','91.239.238.0/24','94.141.192.0/19','94.252.128.0/17','95.87.112.0/21','95.140.96.0/20','95.159.0.0/18','95.212.0.0/17','95.212.128.0/19','95.212.192.0/20','104.167.193.0/24','109.238.144.0/20','130.0.240.0/20','130.180.128.0/18','130.244.72.245/32','130.244.72.246/31','130.244.72.248/30','130.244.72.252/31','130.244.108.61/32','130.244.123.23/32','130.244.123.25/32','130.244.123.113/32','130.244.141.151/32','130.244.149.99/32','130.244.149.195/32','141.105.164.0/24','149.71.239.0/24','173.230.253.88/29','178.52.0.0/16','178.171.128.0/17','178.253.64.0/18','180.189.24.128/25','185.4.84.0/22','185.19.124.0/22','185.23.184.0/22','185.24.60.0/22','185.41.84.0/22','185.52.232.0/22','185.54.132.0/22','185.84.48.0/22','185.84.236.0/22','185.92.28.0/22','185.92.88.0/22','185.96.108.0/22','185.110.104.0/22','188.139.128.0/17','188.160.0.0/16','188.229.128.0/17','188.247.0.0/19','195.60.236.0/22','196.2.4.0/22','198.51.143.0/24','198.51.144.0/23','198.51.146.0/24','209.58.115.0/24','209.58.123.0/24','212.11.192.0/19','213.178.224.0/19','216.6.0.0/23','217.20.208.0/20'];

app.use(ipfilter(ips));

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

    //var totalEther = getTotalEtherReceived();
    //if (totalEther) totalEther = +(totalEther.toPrecision(10));

    res.render('home', {
      //totalEther: totalEther,
      //ethBtcExchangeRate: exchangeRate,
      //btcUsdExchangeRate: btcUsdExchangeRate,
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
          if (req.user.customData.repPercentage <= repPercentage || !req.user.customData.repPercentage || req.user.customData.repPercentage >= repPercentage) {
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
