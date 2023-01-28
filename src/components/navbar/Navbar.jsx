import React from 'react'
import { RiMenu3Line, RiCloseLine } from 'react-icons/ri';
import { ethers } from 'ethers';
import { useState } from 'react';
import { useContext } from "react";
import './navbar.css';
import logo from '../../assets/logo.svg';

const Navbar = () => {

  const provider = useContext(UtilContext);
  const connect = async () => { await provider.send("eth_requestAccounts", []) }
  const [toggleMenu, setToggleMenu]  = useState(false);   //toggleMenu -> il menu è visibile?

  if(typeof window.ethereum !== 'undefined' || (typeof window.web3 !== 'undefined')){
    const isConnected = true;
    const signer = provider.getSigner();
    const { walletAddress } = signer.getAddress().then((address) => {return address})
    const { chainId } = provider.getNetwork().then(res => {return res.chainId});
  } 

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