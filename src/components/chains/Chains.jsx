import React from 'react';
import { useState, useEffect } from 'react';
import useChain from "../../hooks/useChain";
import { Menu, Dropdown, Button } from 'antd';
import { AvaxLogo, PolygonLogo, BSCLogo, ETHLogo } from "./Logos";
import { DownOutlined } from "@ant-design/icons";

const Chains = () => {

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

  const { switchNetwork } = useChain();
  const { chainId } = useMoralisDapp();
  const [selected, setSelected] = useState({});

  useEffect(() => {
    if (!chainId) return null;
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

  return (
    <div>
      <Dropdown content={menu} trigger={["click"]}>
        <Button
          key={selected?.key}
          icon={selected?.icon}
          className='button'
        >
          <span style={{ marginLeft: "5px" }}>{selected?.value}</span>
          <DownOutlined />
        </Button>
      </Dropdown>
    </div>
  );  
}
export default Chains