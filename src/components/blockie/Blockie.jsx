import Blockies from "react-blockies";
import { useUtilConnection } from "../../hooks/useUtilConnection";

/**
 * Shows a blockie image for the provided wallet address
 * @param {*} props
 * @returns <Blockies> JSX Elemenet
 */

function Blockie(props) {
    const { provider, walletAddress } = useUtilConnection();

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