const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const Web3 = require("web3");
const bip39 = require("bip39");
const hdKey = require("hdkey");
const ethutils = require("ethereumjs-util");
const Tx = require("ethereumjs-tx").Transaction;
const fs = require('fs')
const path = require('path');
const User = require("./User");
const Address = require("./address");
const uri =mongoURI

const web3 = new Web3(
  "https://ropsten.infura.io/v3/17967a59c84d4fb6be956954038f1715"
);

const connectDB = async () => {
  await mongoose.connect(uri);
  console.log("Connected to database");
};
connectDB();
const app = express();

const inputrkm = path.join(__dirname, './rkm.json')


var contractAbi = fs.readFileSync(inputrkm, 'utf-8')
var contractAddress = "0xDFb2E716518c29FD9c4041f4b3B7cfe60E543e8C"

app.use(bodyParser.json());
app.get("/", (req, res) => {
  res.status(200).send({ Server: "getting response" });
});

const myContract = new web3.eth.Contract(JSON.parse(contractAbi), contractAddress);

app.post("/register", (req, res) => {
  User.findOne({ email: req.body.email }).then((user) => {
    // Throw an error if user already exist
    if (user) {
      return res
        .status(400)
        .json({ email: "User is already registered with this email" });
    } else {
      // Create new user
      const newUser = new User({
        username: req.body.userName,
        email: req.body.email,
        password: req.body.password,
      });
      newUser.save();
      return res.status(200).json({
        username: newUser.username,
        email: newUser.email,
        password: newUser.password,
      });
    }
  });
});

app.post("/login", (req, res) => {
  User.findOne({ email: req.body.email }).then((user) => {
    if (user.password === req.body.password) {
      res.send({ msg: "Login Success!" });
    } else {
      res.send({ msg: "Invalid user name or password" });
    }
  });
});

app.post("/generateAddress", (req, res) => {
  let userId = req.body.user_id;
  const mnemonic =
    "damp scout boat garlic diary miss extra artist crowd ethics motor naive";
  const seed = bip39.mnemonicToSeed(mnemonic).then((seed) => {
    const root = hdKey.fromMasterSeed(seed);
    const addrNode = root.derive(`m/44'/60'/0'/0/${userId}`);
    const pubkey = ethutils.privateToPublic(addrNode._privateKey);
    const addr = ethutils.publicToAddress(pubkey).toString("hex");
    const address = ethutils.toChecksumAddress("0x" + addr);

    const newAddress = new Address({
      user_id: userId,
      address: address,
    });
    Address.findOne({ address }).then((address) => {
      if (address) {
        return res.send({ address: "address already exist" });
      } else {
        newAddress.save();
        res.status(200).json({ msg: newAddress });
      }
    });
  });
});

app.post("/sendETH", async (req, res) => {
  let user_id = req.body.from_user_id;
  let toAddress = req.body.toAddress;
  let value = req.body.value;
  const mnemonic =
    "damp scout boat garlic diary miss extra artist crowd ethics motor naive";
  const seed = await bip39.mnemonicToSeed(mnemonic);
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

app.post("/getBalanceOfRKM", async(req,res)=>{
  let address = req.body.address;
  let balance = await myContract.methods.balanceOf(address).call()
  let rkmBalance = web3.utils.fromWei(balance ,'ether')
  // console.log()
  // function balanceOf(address _owner) constant returns (uint256 balance);
  res.send({balance: rkmBalance+" RKM"})
  
})

app.post("/getBalanceOfSRO", (req, res) => {
  let address = req.body.address;
  let balance = await 
})

app.listen(3002, console.log("Server started on port number 3002"));
