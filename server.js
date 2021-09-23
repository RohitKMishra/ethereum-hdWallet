const express = require("express");
const Web3 = require("web3");
const bip39 = require("bip39");
const hdKey = require("hdkey");
const ethutils = require("ethereumjs-util");
const Tx = require("ethereumjs-tx").Transaction;
const path = require("path");
const mongoose = require("mongoose");
const Address = require("./address");

const configurator = require('./Config/config')

var web3 = new Web3(
  configurator.InfuraURL
);

const connectDB = async () => {
  await mongoose.connect(configurator.mongoURI);
  console.log("Connected to database");
};
connectDB();

const app = express();
const fs = require("fs");
const bodyParser = require("body-parser");
app.use(bodyParser.json());

const pKey = Buffer.from(configurator.privateKey, "hex");

const inputrkm = path.join(__dirname, "./rkm.json");
const inputsro = path.join(__dirname, "./sro.json");


var contractAbiRKM = fs.readFileSync(inputrkm, "utf-8");
var contractAddressRKM = "0x3e44072e37c959f748f361Ae4ED3b39E952E515c";
var myContractRKM = new web3.eth.Contract(
  JSON.parse(contractAbiRKM),
  contractAddressRKM
);

var contractAbiSRO = fs.readFileSync(inputsro, "utf-8");
var contractAddressSRO = "0x556962f2929c3D9D8A7cc14410356ef0FDd201c3";
var myContractSRO = new web3.eth.Contract(
  JSON.parse(contractAbiSRO),
  contractAddressSRO
);




app.post("/address", (req, res) => {
  console.log("Started");
  let userId = req.body.user_id;

  const seed = bip39.mnemonicToSeed(configurator.mnemonic).then((seed) => {
    const root = hdKey.fromMasterSeed(seed);
    const addrNode = root.derive(`m/44'/60'/0'/0'/${userId}`);
    const pubkey = ethutils.privateToPublic(addrNode._privateKey);
    const addr = ethutils.publicToAddress(pubkey).toString("hex");
    const address = ethutils.toChecksumAddress("0x" + addr);

    fs.appendFile("../test/address.txt", address, (err) => {
      if (err) {
        console.log(err);
        return;
      } else {
        console.log("Work done");
      }
    });
    res.send({ Address: address });
  });
});

app.post("/getBalanceOfSRO", async (req, res) => {
  let address = req.body.address;
  let balance = await myContract.methods.balanceOf(address).call();
  let sroBalance = web3.utils.fromWei(balance, "ether");

  res.send({ balance: sroBalance + "SRO" });
});

app.post("/transferBalance", async (req, res) => {
  let user_id = req.body.from_user_id;
    let toAddress = req.body.toAddress;
    let value = req.body.value;
 

//   let user = await Address.find({ user_id: { $eq: user_id } });
//   let UserData = user[0]._doc;
//   let fromAddress = UserData.address;
//   var amount = web3.utils.toBN(value, "ether");

  var count = await web3.eth.getTransactionCount(configurator.fromAddress);
  var rawTransaction = {
    "from": configurator.fromAddress,
    "nonce": web3.utils.toHex(count),
    "gasPrice": web3.utils.toHex(20 * 1e9),
    "gasLimit": "0x250CA",
    "to": contractAddress,
    "value": "0x0",
    "data": myContract.methods.transfer(toAddress, value).encodeABI(),
};  

  const Transaction = new Tx(rawTransaction, {chain:'ropsten', hardfork: 'petersburg'});
  Transaction.sign(pKey);

  var serialized = Transaction.serialize().toString("hex");
  web3.eth
    .sendSignedTransaction("0x" + serialized)
    .on("transactionHash", function (hash) {
        console.log("transaction Hash :",hash)
      res.send({ "Transaction Hash": hash });
    });
});



app.post("/transferToken", async (req, res) => {
  let token = req.body.token;
  let toAddress = req.body.toAddress;
  let value = req.body.value;

  var contractAddress = ""
  var myContract = ""
  if(token == "RKM"){
      contractAddress = contractAddressRKM
      myContract = myContractRKM 
  }
  if(token == "SRO") {
      contractAddress = contractAddressSRO
      myContract = myContractSRO
  }

  let amount = web3.utils.toWei(value, "ether");
  let count = await web3.eth.getTransactionCount(configurator.fromAddress);

  let rawTransaction = {
    "from": configurator.fromAddress,
    "to": contractAddress,
    "gasPrice": web3.utils.toHex(20 * 1e9),
    "gasLimit": web3.utils.toHex(210000),
    "data": myContract.methods.transfer(toAddress, amount).encodeABI(),
    "value": "0x0",
    "nonce": web3.utils.toHex(count),
  };

  const Transaction = new Tx(rawTransaction, {
    chain: "ropsten",
    hardfork: "petersburg",
  });
  Transaction.sign(pKey);

  var serialized = Transaction.serialize().toString("hex");
  web3.eth.sendSignedTransaction("0x" + serialized).on("transactionHash", function(hash) {
      console.log("transaction Hash :", hash)
      res.send({ "Transaction Hash from RKM" : hash})
  })
    

});



app.post("/sendETH", async (req, res) => {
  let user_id = req.body.from_user_id;
  let toAddress = req.body.toAddress;
  let value = req.body.value;

  const seed = await bip39.mnemonicToSeed(configurator.mnemonic);
  const root = hdKey.fromMasterSeed(seed);
  const addrNode = root.derive(`m/44'/60'/0'/0/${user_id}`);
  const privateKey = addrNode._privateKey.toString("hex");
  const pKey = Buffer.from(privateKey, 'hex')

  let user = await Address.find({ user_id: { $eq: user_id } });
  let UserData = user[0]._doc;
  let fromAddress = UserData.address;

  var amount = web3.utils.toWei(value, "ether");
  let count = await web3.eth.getTransactionCount(fromAddress);

  var rawTransaction = {
    "from": fromAddress,
    "to": toAddress,
    "gasPrice": web3.utils.toHex(20 * 1e9),
    "gasLimit" :web3.utils.toHex(210000), 
    "value":web3.utils.toHex(amount),
    "data": "0x0",
    "nonce": web3.utils.toHex(count),
  };

  const Transaction = new Tx(rawTransaction, {chain:'ropsten', hardfork: 'petersburg'})
  Transaction.sign(pKey);

  var serialized = Transaction.serialize().toString("hex");
  web3.eth
    .sendSignedTransaction("0x" + serialized)
    .on("transactionHash", function (hash) {
      res.send({ "Transaction Hash": hash });
    });
});




app.listen(3001, () => {
  console.log("Server started on port 3001");
});
