import React from 'react'
import { RiMenu3Line, RiCloseLine } from 'react-icons/ri';
import { useState } from 'react';
import { useUtilConnection } from '../../hooks/useUtilConnection';
import './navbar.css';
import logo from '../../assets/logo.svg';

const Navbar = () => {

  const { connect, isConnected } = useUtilConnection();
  const [toggleMenu, setToggleMenu]  = useState(false);   //toggleMenu -> il menu è visibile?

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
       </div> //TODO cambia pulsante isConnected or not
       
    </div>
  )
}

export default Navbar