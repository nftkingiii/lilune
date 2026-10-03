import { liluneTokenAbi, liluneTokenBytecode } from "./liluneToken";

// Deploys a LiluneToken and waits for the receipt. Kept free of wallet and chain
// setup so the same path can be exercised against a local test chain.
export async function deployLiluneToken({ walletClient, publicClient, account }, { name, symbol, premise, supply }) {
  const hash = await walletClient.deployContract({
    account,
    abi: liluneTokenAbi,
    bytecode: liluneTokenBytecode,
    args: [name, symbol, premise, BigInt(supply)],
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success" || !receipt.contractAddress) {
    throw new Error("The token deployment was reverted on Monad testnet.");
  }
  return { hash, address: receipt.contractAddress, blockNumber: Number(receipt.blockNumber) };
}
