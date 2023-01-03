import React from 'react'
import { RiMenu3Line, RiCloseLine } from 'react-icons/ri';
import { ethers } from 'ethers';
import { useState } from 'react';
import { useContext } from "react";
import { ProviderContext } from "../../App";
import './navbar.css';
import logo from '../../assets/logo.svg';

const Navbar = () => {

  const provider = useContext(ProviderContext);
  const connect = async () => { await provider.send("eth_requestAccounts", []) }

  //toggleMenu -> il menu è visibile?
  const [toggleMenu, setToggleMenu]  = useState(false);

  return (
    <div className='navbar'>

        <div className='navbar-links_image'>
          <img src={logo} alt='logo' />
        </div>

        <div className='navbar-links_container'>
            <p><a href="#home">Home</a></p>
            <p><a href='#market-tasks'>Market-Tasks</a></p>
        </div>

        <div className='navbar-links_connect'>
          <button type='button' onClick={connect}>Connect</button>
       </div>
       
    </div>
  )
}

export default Navbar