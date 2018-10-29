pragma solidity ^0.4.24;

import "./SafeMath.sol";

contract Splitter {

    using SafeMath for uint;

    mapping (
        address => uint
    ) balances;

    function amountCheck(uint amount) public pure returns (bool) {
        return (amount > 0);
    }

    function getDivided(uint numerator, uint denominator) public pure returns (uint quotient, uint remainder) {
        quotient = numerator.div(denominator);
        remainder = numerator.mod(2);
        return (quotient, remainder);
    }

    function split(address receiverA, address receiverB) public payable returns (bool) {
        require(amountCheck(msg.value), "amount should great than zero");

        uint quotient;
        uint remainder;
        (quotient, remainder) = getDivided(msg.value, 2);

        // store receiver balance in smart contract state
        // when receiver calls withdraw, they can take their own balance back
        balances[receiverA] = balances[receiverA].add(quotient);
        balances[receiverB] = balances[receiverB].add(quotient);

        // sender can get rest of the balance back at this phase
        if (remainder > 0) {
            msg.sender.transfer(remainder);
        }

        return true;
    }

    function withdraw() public returns (bool) {
        uint balance = balances[msg.sender];
        require (balance > 0, "reciever has no balance to withdraw");

        balances[msg.sender] = 0;
        msg.sender.transfer(balance);

        return true;
    }

    function getBalance(address receiver) public view returns (uint) {
        return balances[receiver];
    }

    function say(string word) public pure returns (string) {
        return word;
    }
}