import React from 'react'
import { RiMenu3Line, RiCloseLine } from 'react-icons/ri';
import { ethers } from 'ethers';
import { useState } from 'react';

import './navbar.css';
import logo from '../../assets/logo.svg';

const Menu = () => {
  <>
  <p><a href='#home'>Home</a></p>
  <p><a href='#wgpt3'>What is task-sama</a></p>
  <p><a href='#possibility'>openAI</a></p>
  <p><a href='#features'>demone</a></p>
  <p><a href='#blog'>Library</a></p>
  </>
}

const Navbar = () => {

  //toggleMenu -> il menu è visibile?
  const [toggleMenu, setToggleMenu]  = useState(false);

  const provider = new ethers.providers.Web3Provider(window.ethereum)
  const connect = async () => await provider.send('eth_requestAccounts', []);
  return (
    <div className='gpt3_navbar'>
      <div className='gpt3_navbar-links'>
        <div className='gpt3_navbar-links_logo'>
          <img src={logo} alt='logo' />
        </div>

        <div className='gpt3_navbar-links_container'>
            <p><a href="#home">Home</a></p>
            <p><a href="#wgpt3">What is taskSama?</a></p>
            <p><a href="#possibility">Open AI</a></p>
            <p><a href="#features">Case Studies</a></p>
            <p><a href="#blog">Demone</a></p>    
        </div>
      </div>

    <div className='gpt3_navbar-sign'>
      <p>Sign in</p>
      <button type='button' onClick={connect}>Connect</button>
    </div>

    <div className="gpt3_navbar-menu">
        {toggleMenu
          ? <RiCloseLine color="#fff" size={27} onClick={() => setToggleMenu(false)} />
          : <RiMenu3Line color="#fff" size={27} onClick={() => setToggleMenu(true)} />}
        {toggleMenu && (
        <div className="gpt3_navbar-menu_container scale-up-center">
          <div className="gpt3_navbar-menu_container-links">
            <p><a href="#home">Home</a></p>
            <p><a href="#wgpt3">What is taskSama?</a></p>
            <p><a href="#possibility">Open AI</a></p>
            <p><a href="#features">Case Studies</a></p>
            <p><a href="#blog">Demone</a></p>
          </div>
          <div className="gpt3_navbar-menu_container-links-sign">
            <p>Sign in</p>
            <button type="button">Sign up</button>
          </div>
        </div>
        )}
      </div>
    </div>
  )
}

export default Navbar