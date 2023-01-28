import { useState } from 'react';
import React from 'react'
import useChain from "./useChain";
import { ethers } from 'ethers';
import { networkConfigs } from '../helpers/networks';

export const useUtilConnection = () => {

  const provider = ((window.ethereum != null) ? new ethers.providers.Web3Provider(window.ethereum) : ethers.providers.getDefaultProvider());

  var walletAddress;
  var chainId = (isConnected() ? getChainId(provider) : null);

  const connect = async () => { 
    await provider.send("eth_requestAccounts", []) 
    const signer = provider.getSigner();
    walletAddress = signer.getAddress().then((address) => {return address})
    chainId = provider.getNetwork().then(res => {return res.chainId});
  }


  const isConnected = () => {
    if(typeof window.ethereum !== 'undefined' || (typeof window.web3 !== 'undefined')){
        const isConnected = true;
    } 
    return isConnected;
  }  
  
  async function getChainId(provider) {
    const network = await provider.getNetwork();
    console.log("chainId", network.chainId);
    return network;
  }

  async function switchNetwork(chain) {
    if (provider.isConnected()) { 
      try {
        await provider.setNetwork(chain);
      } catch (error) {
        console.log("errore setNetwork: ",error);
      }
    } else {
        await provider.send("eth_requestAccounts", []);
    }
  }

  return { provider, walletAddress, chainId, connect, isConnected, getChainId, switchNetwork };
};
