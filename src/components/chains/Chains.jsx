import React from 'react';
import { useState, useEffect } from 'react';
import useChain from "../../hooks/useChain";
import { Menu, Dropdown, Button } from 'antd';
import { AvaxLogo, PolygonLogo, BSCLogo, ETHLogo } from "./Logos";
import { DownOutlined } from "@ant-design/icons";
import { ProviderContext } from '../../App';
import { useContext } from 'react';

const Chains = () => {

  const provider = useContext(ProviderContext);
  const { switchNetwork } = useChain();
  const [selected, setSelected] = useState({});
  const { chainId } = getChainId();

  const menuItems = [
    {
      key: "0x1",
      value: "Ethereum",
      icon: <ETHLogo />,
    },
    {
      key: "0x13881",
      value: "Mumbai",
      icon: <PolygonLogo />,
    },
     {
       key: "0xa86a",
       value: "Avalanche",
       icon: <AvaxLogo />,
     }
  ];

  async function getChainId() {
    const network = await provider.getNetwork();
    console.log("chainId", network.chainId);
  }

  useEffect(() => {
    if (!chainId) return;
    const newSelected = menuItems.find((item) => item.key === chainId);
    setSelected(newSelected);
    console.log("current chainId: ", chainId);
  }, [chainId]);

  const handleMenuClick = (e) => {
    console.log("switch to: ", e.key);
    switchNetwork(e.key);
  };

  const menu = (
    <Menu onClick={handleMenuClick}>
        {menuItems.map((item) => (
              <Menu.Item className='item' key={item.key} icon={item.icon}>
                <span style={{ marginLeft: "5px" }}>{item.value}</span>
              </Menu.Item>
        ))}
    </Menu> 
  );

  //TODO fixa
  return (
      <div>
        <Dropdown content={menu} trigger={["click"]}>
          <Button
            key={selected?.key}
            icon={selected?.icon}
            className='button'>
            Click me
            <span style={{ marginLeft: "5px" }}>{selected?.value}</span>
            <DownOutlined />
          </Button>
        </Dropdown>
      </div>
  );  
}
export default Chains