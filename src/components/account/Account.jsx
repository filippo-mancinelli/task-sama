import { getEllipsisTxt } from "../../helpers/formatters";
import Blockie from "../blockie/Blockie";
import { Button, Card, Modal } from "antd";
import { useState } from "react";
import Address from "../address/Address";
import { SelectOutlined } from "@ant-design/icons";
import { getExplorer } from "../../helpers/networks";
import { useContext } from "react";

const provider = useContext(UtilContext);
const [isModalVisible, setIsModalVisible] = useState(false);
const { authenticate, logout } = useMoralis();

function Account() {
  const connect = async () => { await provider.send("eth_requestAccounts", []) }

  if(typeof window.ethereum !== 'undefined' || (typeof window.web3 !== 'undefined')){
    const isConnected = true;
    const signer = provider.getSigner();
    const { walletAddress } = signer.getAddress().then((address) => {return address})
    const { chainId } = provider.getNetwork().then(res => {return res.chainId});
  } 

  
  if (!isConnected) {
    return (
      <div className="account" onClick={connect}>
        <p className="text">Authenticate</p>
      </div>
    );
  }

  return (
    <>
      <div style={styles.account} onClick={() => setIsModalVisible(true)}>
        <p style={{ marginRight: "5px", ...styles.text }}>
          {getEllipsisTxt(walletAddress, 6)}
        </p>
        <Blockie currentWallet scale={3} />
      </div>
      <Modal
        visible={isModalVisible}
        footer={null}
        onCancel={() => setIsModalVisible(false)}
        bodyStyle={{
          padding: "15px",
          fontSize: "17px",
          fontWeight: "500",
        }}
        style={{ fontSize: "16px", fontWeight: "500" }}
        width="400px"
      >
        Account
        <Card
          style={{
            marginTop: "10px",
            borderRadius: "1rem",
          }}
          bodyStyle={{ padding: "15px" }}
        >
          <Address
            avatar="left"
            size={6}
            copyable
            style={{ fontSize: "20px" }}
          />
          <div style={{ marginTop: "10px", padding: "0 10px" }}>
            <a
              href={`${getExplorer(chainId)}/address/${walletAddress}`}
              target="_blank"
              rel="noreferrer"
            >
              <SelectOutlined style={{ marginRight: "5px" }} />
              View on Explorer
            </a>
          </div>
        </Card>
        <Button
          size="large"
          type="primary"
          style={{
            width: "100%",
            marginTop: "10px",
            borderRadius: "0.5rem",
            fontSize: "16px",
            fontWeight: "500",
          }}
          onClick={() => {
            logout();
            setIsModalVisible(false);
          }}
        >
          Disconnect Wallet
        </Button>
      </Modal>
    </>
  );
}

export default Account;