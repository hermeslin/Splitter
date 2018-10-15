pragma solidity ^0.4.24;

contract Splitter {

    function amountCheck(uint amount) public pure returns (bool) {
        return (amount > 0) ? true : false;
    }

    function getDivided(uint numerator, uint denominator) public pure returns (uint quotient, uint remainder) {
        quotient = numerator / denominator;
        remainder = numerator - denominator * quotient;
        return (quotient, remainder);
    }

    function split(address receiverA, address receiverB) public payable returns (bool) {
        uint amount = msg.value;

        require(amountCheck(amount), "amount should great than zero");

        uint quotient;
        uint remainder;
        (quotient, remainder) = getDivided(amount, 2);

        if (quotient > 0) {
            receiverA.transfer(quotient);
            receiverB.transfer(quotient);
        }

        if (remainder > 0) {
            msg.sender.transfer(remainder);
        }
    }

    function say(string word) public pure returns (string) {
        return word;
    }
}