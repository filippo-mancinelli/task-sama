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
//import "antd/dist/antd.css"; //??
//import Text from "antd/lib/typography/Text"; //??


const App = () => {
 
  const provider = ((window.ethereum != null) ? new ethers.providers.Web3Provider(window.ethereum) : ethers.providers.getDefaultProvider());

  const [inputValue, setInputValue] = useState("explore");
  console.log('inputValue:', inputValue);

  return (
    <>
      <div className="App">
        <Router>
            <Navbar />
            <Header parentToChildInputValue={inputValue}/>
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
    </>


  )
}

export default App;
