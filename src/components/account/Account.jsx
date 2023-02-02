import { getEllipsisTxt } from "../../helpers/formatters";
import Blockie from "../blockie/Blockie";
import { Button, Card, Modal } from "antd";
import { useState } from "react";
import Address from "../address/Address";
import { SelectOutlined } from "@ant-design/icons";
import { getExplorer } from "../../helpers/networks";
import { useUtilConnection } from "../../hooks/useUtilConnection";


function Account() {
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { provider, connect, isConnected, signer, walletAddress, chainId, disconnect} = useUtilConnection();
  
  if (!isConnected) {
    return (
      <div className="account" onClick={connect}>
        <p className="text">Authenticate</p>
      </div>
    );
  }

  return (
    <>
      <div className="account" onClick={() => setIsModalVisible(true)}>
        <p className="text">
          {getEllipsisTxt(walletAddress, 6)}
        </p>
        <Blockie currentWallet scale={3} />
      </div>
      <Modal
        open={isModalVisible}
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
            disconnect();
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