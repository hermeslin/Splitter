import { default as Promise } from 'bluebird';
const Splitter = artifacts.require("Splitter");

Promise.promisifyAll(web3.eth, { suffix: 'Promise' });

const calculateTransactionFee = async (transaction) => {
  let tx = await web3.eth.getTransactionPromise(transaction.tx);
  let receipt = await web3.eth.getTransactionReceiptPromise(transaction.tx);
  return tx.gasPrice.mul(receipt.gasUsed);
}

contract('Splitter', async (accounts) => {

  it ('receive hello world string', async () => {
    let splitter = await Splitter.deployed();
    let result = await splitter.say.call('hello world');
    assert.equal(result, 'hello world');
  })

  it ('amount should great than zero', async () => {
    let splitter = await Splitter.deployed();

    let falseResult = await splitter.amountCheck.call(0);
    assert.equal(falseResult, false);

    let trueResult = await splitter.amountCheck.call(1);
    assert.equal(trueResult, true);
  });

  it ('divided should correct', async () => {
    let splitter = await Splitter.deployed();
    let quotient, remainder;

    [quotient, remainder] = await splitter.getDivided.call(1, 2);
    assert.equal(quotient, 0);
    assert.equal(remainder, 1);

    [quotient, remainder ] = await splitter.getDivided.call(2, 2);
    assert.equal(quotient, 1);
    assert.equal(remainder, 0);

    [quotient, remainder] = await splitter.getDivided.call(3, 2);
    assert.equal(quotient, 1);
    assert.equal(remainder, 1);

    [quotient, remainder] = await splitter.getDivided.call(4, 2);
    assert.equal(quotient, 2);
    assert.equal(remainder, 0);

    [quotient, remainder] = await splitter.getDivided.call(5, 2);
    assert.equal(quotient, 2);
    assert.equal(remainder, 1);
  })

  it('split amount 10 to two difference address', async () => {
    let splitter = await Splitter.deployed();

    let [Alice, Bob, Carol] = accounts;

    // initial balance
    let AliceBalance = await web3.eth.getBalance(Alice);
    let BobBalance = await web3.eth.getBalance(Bob);
    let CarolBalance = await web3.eth.getBalance(Carol);

    let splitTransaction = await splitter.split(Bob, Carol, { from: Alice, value: 10 });
    let transactionFee = await calculateTransactionFee(splitTransaction);

    // final balance
    let AliceBalanceFinal = await web3.eth.getBalance(Alice);
    let BobBalanceFinal = await web3.eth.getBalance(Bob);
    let CarolBalanceFinal = await web3.eth.getBalance(Carol);

    assert.equal(AliceBalanceFinal.plus(transactionFee).plus(10).toString(), AliceBalance.toString());
    assert.equal(BobBalanceFinal.minus(BobBalance).toString(), '5');
    assert.equal(CarolBalanceFinal.minus(CarolBalance).toString(), '5');
  })

  it('split amount 9 to two difference address', async () => {
    let splitter = await Splitter.deployed();

    let [Alice, Bob, Carol] = accounts;

    // initial balance
    let AliceBalance = await web3.eth.getBalance(Alice);
    let BobBalance = await web3.eth.getBalance(Bob);
    let CarolBalance = await web3.eth.getBalance(Carol);

    let splitTransaction = await splitter.split(Bob, Carol, { from: Alice, value: 9 });
    let transactionFee = await calculateTransactionFee(splitTransaction);

    // final balance
    let AliceBalanceFinal = await web3.eth.getBalance(Alice);
    let BobBalanceFinal = await web3.eth.getBalance(Bob);
    let CarolBalanceFinal = await web3.eth.getBalance(Carol);

    // actually, alice sent 8 weis to other address
    assert.equal(AliceBalanceFinal.plus(transactionFee).plus(8).toString(), AliceBalance.toString());
    assert.equal(BobBalanceFinal.minus(BobBalance).toString(), '4');
    assert.equal(CarolBalanceFinal.minus(CarolBalance).toString(), '4');
  })
})