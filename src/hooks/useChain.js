import { networkConfigs } from "../helpers/networks";
import { ethers } from 'ethers';
import { useContext } from "react";
import { ProviderContext } from "../App"

const useChain = () => {

  const provider = useContext(ProviderContext);

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
  return { switchNetwork };
};

export default useChain;