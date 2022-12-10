import React from 'react'
import { RiMenu3Line, RiCloseLin } from 'react-icons/ri';
import { ethers } from "ethers";
import './navbar.css';
import logo from '../../assets/logo.svg';
//BEM -> Block Element Modifier 

const provider = new ethers.providers.Web3Provider(window.ethereum)
const connect = async () => await provider.send("eth_requestAccounts", []);

const Navbar = () => {
  return (
    <div className="gpt3_navbar">
      <div className="gpt3_navbar-links">
        <div className="gpt3_navbar-links_logo">
          <img src={logo} alt="logo" />
        </div>

        <div className="gpt3_navbar-links_container">
          <p><a href="#home">Home</a></p>
          <p><a href="#wgpt3">What is task-sama</a></p>
          <p><a href="#possibility">openAI</a></p>
          <p><a href="#features">demone</a></p>
          <p><a href="#blog">Library</a></p>
        </div>
      </div>

    <div className="gpt3_navbar-sign">
      <p>Sign in</p>
      <button type="button">Sign up</button>
      <button type="button" onClick={connect}>Connect</button>
    </div>

    </div>
  )
}

export default Navbar