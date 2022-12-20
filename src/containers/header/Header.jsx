import React from 'react';
import NftVideo from '../../components/nftVideo/NftVideo';
import { useState } from 'react';
import './header.css'

const Header = () => {

  const [inputValue, setInputValue] = useState("explore");
  
  return (
    <div className='header' id='home'>

        <nav className='menu'>
          <ul>
            <li><a href='http://'>🛒 Explore Market</a></li>
            <li><a href='http://'>🖼 Your Collection</a></li>
            <li><a href='http://'>📑 Your Transactions</a></li>
          </ul>
        </nav>
    </div>

  )
}

export default Header