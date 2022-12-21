import React from 'react';
import NftVideo from '../../components/nftVideo/NftVideo';
import { useState } from 'react';
import './header.css';
import Chains from "../../components/chains/Chains";
import NativeBalance from "../../components/nativeBalance/NativeBalance";
import Account from "../../components/account/Account";
import SearchCollections from '../../components/searchCollections/SearchCollections';

//parentToChild catcha il dato passato dal component Padre <App.js>
const Header = ({parentToChildInputValue}) => {
  console.log("parentToChildInputValue FIGLIO: ", parentToChildInputValue);

  const [inputValue, setInputValue] = useState("explore");


  return (
    <React.Fragment>
      <div className='header' id='home'>

        <nav className='menu'>

          <ul>
            <li><SearchCollections setInputValue={setInputValue}/></li>
            <li><a href='http://'>🛒 Explore Market</a></li>
            <li><a href='http://'>🖼 Your Collection</a></li>
            <li><a href='http://'>📑 Your Transactions</a></li>
          </ul>
        </nav>
      </div>


      <div className='headerRight'>
        <Chains />
        <NativeBalance />
        <Account />
      </div>
    </React.Fragment>
  )
}

export default Header