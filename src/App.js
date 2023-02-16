import React from 'react'
import { useEffect, useState} from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  NavLink,
  Navigate,
  BrowserRouter,
} from "react-router-dom";
import { Footer, Header } from './containers';
import Navbar from './components/navbar/Navbar';
import NFTBalance from "./components/nftBalance/NFTBalance";
import NFTTokenIds from "./components/nftTokenIds/NFTTokenIds";
import NFTMarketTransactions from "./components/nftMarketTransactions/NFTMarketTransactions";
import './App.css';
import { ethers } from 'ethers';
import { createContext } from 'react';
//import "antd/dist/antd.css"; //??
//import Text from "antd/lib/typography/Text"; //??

export const EthereumContext = React.createContext();

//const provider = ((window.ethereum != null) ? new ethers.providers.Web3Provider(window.ethereum) : ethers.providers.getDefaultProvider());
//const provider = new ethers.providers.JsonRpcProvider('https://goerli.infura.io/v3/e595556a6f02441e809bc933758ab52a');  //Infura
const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');  //Ganache

const contractABI = [ "JSONZ" ]; //TODO remix/truffle
const contractNftABI = [ "JSONZ" ]; //TODO remix/truffle
const contractAddress = "0x..."; //TODO remix/truffle
const contractInstance = new ethers.Contract(contractAddress, contractABI, (typeof window.ethereum !== 'undefined' || (typeof window.web3 !== 'undefined') ?  provider : null));


const App = () => {

  const [inputValue, setInputValue] = useState("explore");
  console.log('inputValue:', inputValue);

  return (
    <>
      <EthereumContext.Provider value={{ provider, contractABI, contractNftABI, contractAddress, contractInstance }}>
        <div className="App">
          <Router>
              <Navbar />
              <Header parentToChildInputValue={{inputValue}}/>
          </Router>
        <div>

        <div className='content'>
          <BrowserRouter>
            <Routes>
              <Route path="/nftBalance" element={<NFTBalance />} />
              <Route path="/NFTMarketPlace" element={<NFTTokenIds inputValue={inputValue} setInputValue={setInputValue} />} />
              <Route path="/Transactions" element={<NFTMarketTransactions />} />
            </Routes>
          </BrowserRouter>

        </div>

        </div>
          <Footer />
        </div>
      </EthereumContext.Provider>
    </>


  )
}

export default App;
