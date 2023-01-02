import { networkConfigs } from "../helpers/networks";
import { ethers } from 'ethers';
import { provider } from "../components/navbar/Navbar";


const useChain = () => {
  async function switchNetwork(chain) {
    if (provider.isConnected()) { 
      try {
        await provider.setNetwork(chain);
      } catch (error) {
        if (error.code === 4902) {
          try {
            const config = networkConfigs[chain];
            const { chainId, chainName, currencyName, currencySymbol, rpcUrl, blockExplorerUrl } =
              config;
            await Moralis.addNetwork(
              chainId,
              chainName,
              currencyName,
              currencySymbol,
              rpcUrl,
              blockExplorerUrl
            );
          } catch (error) {
            alert(error.message);
          }
        }
      }
    } else {
       await provider.send("eth_requestAccounts", []);
    }
  }
  return { switchNetwork };
};

export default useChain;