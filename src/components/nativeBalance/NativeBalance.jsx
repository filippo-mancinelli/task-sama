import React from 'react'
import { useNativeBalance } from "../../hooks/useNativebalance";
import { n4 } from "../../helpers/formatters";

const NativeBalance = (props) => {

  const { balance, nativeName } = useNativeBalance(props);

  return (
    <div style={{ textAlign: "center", whiteSpace: "nowrap" }}>{`${n4.format(
      balance.formatted
    )} ${nativeName}`}</div>
  );

}

export default NativeBalance