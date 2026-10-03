// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @title LiluneToken
/// @notice Minimal ERC-20 deployed from Lilune's Launch Studio on Monad testnet.
/// The full supply is minted to the creator. The premise is stored onchain so
/// anyone can read what the market is about from the contract itself.
contract LiluneToken {
    string public name;
    string public symbol;
    string public premise;
    uint8 public constant decimals = 18;
    uint256 public totalSupply;
    address public immutable creator;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(string memory name_, string memory symbol_, string memory premise_, uint256 wholeSupply) {
        require(wholeSupply > 0, "supply");
        name = name_;
        symbol = symbol_;
        premise = premise_;
        creator = msg.sender;
        totalSupply = wholeSupply * 10 ** decimals;
        balanceOf[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }

    function transfer(address to, uint256 value) external returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            require(allowed >= value, "allowance");
            allowance[from][msg.sender] = allowed - value;
        }
        _transfer(from, to, value);
        return true;
    }

    function _transfer(address from, address to, uint256 value) private {
        require(to != address(0), "to");
        uint256 balance = balanceOf[from];
        require(balance >= value, "balance");
        unchecked {
            balanceOf[from] = balance - value;
        }
        balanceOf[to] += value;
        emit Transfer(from, to, value);
    }
}
