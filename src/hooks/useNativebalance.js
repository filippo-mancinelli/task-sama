import { getNativeByChain } from "../helpers/networks";
import { useEffect, useMemo, useState } from "react";
import { getChainId } from "../components/chains/Chains";
import { useContext } from "react";
import { ethers } from "ethers";
import { useUtilConnection } from "./utilConnection";

export const useNativeBalance = (options) => {

  const { provider } = useUtilConnection(); 
  const { chainId } = getChainId(provider); //TODO
  
  const nativeName = useMemo(() => getNativeByChain(options?.chain || chainId), [options, chainId]);
  const [balance, setBalance] = useState({ inWei: 0, formatted: 0 });

  if(typeof window.ethereum !== 'undefined' || (typeof window.web3 !== 'undefined')){
    const signer = provider.getSigner();
    const { walletAddress } = signer.getAddress().then((address) => {return address})
    const { balance } = provider.getBalance(walletAddress)
  }

  useEffect(() => {
    if (balance == null) {
      const balances = {
        inWei: balance,
        // missing second argument (decimals) in FromWei function,
        formatted: ethers.utils.formatEther(balance),
      };
      setBalance(balances);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [balance]);

  return { balance, nativeName };
};