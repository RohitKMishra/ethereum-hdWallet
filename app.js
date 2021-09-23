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
const uri ="mongodb+srv://rohitmishra:rohit123@cluster0.btwb5.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

// const web3 = new Web3(
//   "https://ropsten.infura.io/v3/17967a59c84d4fb6be956954038f1715"
// );

const web3 = new Web3(
  "http://13.233.201.239:30303"
);

const connectDB = async () => {
  await mongoose.connect(uri);
  console.log("Connected to database");
};
connectDB();
const app = express();

const inputrkm = path.join(__dirname, './rkm.json')

web3.eth.isSyncing().then(console.log)

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
