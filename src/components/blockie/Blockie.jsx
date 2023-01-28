import Blockies from "react-blockies";

/**
 * Shows a blockie image for the provided wallet address
 * @param {*} props
 * @returns <Blockies> JSX Elemenet
 */

function Blockie(props) {
    const provider = useContext(UtilContext);
    if(typeof window.ethereum !== 'undefined' || (typeof window.web3 !== 'undefined')){
        const signer = provider.getSigner();
        const { walletAddress } = signer.getAddress().then((address) => {return address})
    }

    if ((!props.address && !props.currentWallet) || !walletAddress) return null;

    return (
        <Blockies
        seed={props.currentWallet ? walletAddress.toLowerCase() : props.address.toLowerCase()}
        className="identicon"
        {...props}
        />
    );
}

export default Blockie;