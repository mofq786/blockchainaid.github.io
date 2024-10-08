import Web3 from "web3";

let web3;

if (typeof window !== "undefined" && typeof window.web3 !== "undefined") {
  // we are in the browser and meta mask is installed
  web3 = new Web3(window.ethereum);
} else {
  // we are on the server *OR* meta mask is not running
  // creating our own provider
  const provider = new Web3.providers.HttpProvider(
    "https://eth-sepolia.g.alchemy.com/v2/zKcZ0eD-TwTnQ4iMLH9GTNIjl-exhAV1"
  );

  web3 = new Web3(provider);
}

export default web3;
