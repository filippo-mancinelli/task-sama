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

const provider = ((window.ethereum != null) ? new ethers.providers.Web3Provider(window.ethereum) : ethers.providers.getDefaultProvider());
//const provider = new ethers.providers.JsonRpcProvider('https://goerli.infura.io/v3/e595556a6f02441e809bc933758ab52a');  //Infura
//const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');  //Ganache

const taskMarketplaceContract = fetch('./contracts/TaskMarketplace.json', {method: 'GET', headers: {'Content-Type': 'application/json'}}).then(response => response.json());  //javascript object containing json
const taskVideosContract = fetch('./contracts/TaskVideos.json').then(response => response.json());
const tasksContract = fetch('./contracts/Tasks.json').then(response => response.json());

const taskMarketplaceABI = taskMarketplaceContract.then(response => JSON.stringify(response.abi));  //convert the 'abi' value of the js object containing the json
const taskVideosABI = taskVideosContract.then(response => JSON.stringify(response.abi));
const tasksABI = tasksContract.then(response => JSON.stringify(response.abi));

const taskMarketplaceContractInstance = taskMarketplaceABI.then(responseABI => new ethers.Contract("0x4C1540118ccE9EB6463D6E1b3bcDdB30dAfE0D54", responseABI, (typeof window.ethereum !== 'undefined' || (typeof window.web3 !== 'undefined') ?  provider : ethers.getDefaultProvider)));
const taskVideosContractInstance = taskVideosABI.then(responseABI => new ethers.Contract("0x373b1Da4D63088fEDF5BD8E624a80eeFC6d679B0", responseABI, (typeof window.ethereum !== 'undefined' || (typeof window.web3 !== 'undefined') ?  provider : ethers.getDefaultProvider)));
const tasksContractInstance = tasksABI.then(responseABI => new ethers.Contract("0xD525458516837B7C502bc7e3931132101034029b", responseABI, (typeof window.ethereum !== 'undefined' || (typeof window.web3 !== 'undefined') ?  provider : ethers.getDefaultProvider)));

console.log(taskMarketplaceContractInstance);
console.log(ethers.getDefaultProvider);

const App = () => {

  return (
    <>
      <EthereumContext.Provider value={{ provider, taskMarketplaceABI, taskVideosABI, tasksABI, taskMarketplaceContractInstance, taskVideosContractInstance, tasksContractInstance }}>
        <div className="App">
          <Router>
              <Navbar />
              <Header />
          </Router>
        <div>

        <div className='content'>
          <BrowserRouter>
            <Routes>
              <Route path="/nftBalance" element={<NFTBalance />} />
              <Route path="/NFTMarketPlace" element={<NFTTokenIds />} />
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
