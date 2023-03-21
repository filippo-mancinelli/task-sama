import { getNativeByChain } from "../helpers/networks";
import { ethers } from "ethers";
import { useUtilConnection } from "./useUtilConnection";

export const useNativeBalance = (options) => {

  const { provider, chainId } = useUtilConnection(); 
  const [balance, setBalance] = useState({ inWei: 0, formatted: 0 });
  const nativeName = useMemo(() => getNativeByChain(options?.chain || chainId), [options, chainId]);

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