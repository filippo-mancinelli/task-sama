import React from 'react';
import { useState, useEffect } from 'react';
import useChain from "../../hooks/useChain";
import { Menu, Dropdown, Button } from 'antd';
import { AvaxLogo, PolygonLogo, BSCLogo, ETHLogo } from "./Logos";
import { DownOutlined } from "@ant-design/icons";
import { useContext } from 'react';
import { useUtilConnection } from "./utilConnection";

const Chains = () => {

  const { provider, switchNetwork } = useUtilConnection();
  const [selected, setSelected] = useState({});
  const chainId = useUtilConnection.getChainId(provider);

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

  useEffect(() => {
    if (!chainId) return;
    const newSelected = menuItems.find((item) => item.key === chainId);
    setSelected(newSelected);
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