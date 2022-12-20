import React from 'react'
import { useEffect, useState} from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  NavLink,
  Redirect,
} from "react-router-dom";
import { Footer, Header } from './containers';
import Navbar from './components/navbar/Navbar';
import Account from "./components/account/Account";
import Chains from "./components/chains/Chains";
import NFTBalance from "./components/nftBalance/NFTBalance";
import NFTTokenIds from "./components/nftTokenIds/NFTTokenIds";
import NFTMarketTransactions from "./components/nftMarketTransactions/NFTMarketTransactions";
import SearchCollections from "./components/searchCollections/SearchCollections";
import NativeBalance from "./components/nativeBalance/NativeBalance";
//import "antd/dist/antd.css"; //??
//import "./style.css";
import './App.css';
//import Text from "antd/lib/typography/Text"; //??

//const { Header, Footer } = Layout;



const App = () => {
    
  /*moralis
  useEffect(() => {
    if (isAuthenticated && !isWeb3Enabled && !isWeb3EnableLoading) enableWeb3();
  }, [isAuthenticated, isWeb3Enabled]);
  */

  return (
    <div className="App">
      <Router>
        <Navbar />
        <Header />
      </Router>
        <div>

        </div>
      <Footer />
    </div>


    
  )
}

export default App