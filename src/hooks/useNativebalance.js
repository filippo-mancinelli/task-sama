import { getNativeByChain } from "../helpers/networks";
import { useEffect, useMemo, useState } from "react";
import { getChainId } from "../components/chains/Chains";
import { useContext } from "react";
import { ProviderContext } from "../App";


export const useNativeBalance = (options) => {
  const provider = useContext(ProviderContext);
  const signer = provider.getSigner();

  const { account } = useMoralisWeb3Api();
  const { chainId } = getChainId(provider);
  const nativeName = useMemo(() => getNativeByChain(options?.chain || chainId), [options, chainId]);
  const [balance, setBalance] = useState({ inWei: 0, formatted: 0 });

  if(provider.isConnected()){
    const { walletAddress } = signer.getAddress().then((address) => {return address})
    const { balance } = provider.getBalance(walletAddress)
  }

  useEffect(() => {
    if (data?.balance) {
      const balances = {
        inWei: data.balance,
        // missing second argument (decimals) in FromWei function,
        formatted: Moralis.Units.FromWei(data.balance),
      };
      setBalance(balances);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return { getBalance, balance, nativeName, error, isLoading };
};