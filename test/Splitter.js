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

  it('split 10 weis to two difference address', async () => {
    let splitter = await Splitter.deployed();

    let [Alice, Bob, Carol] = accounts;

    // initial balance
    let AliceBalance = await web3.eth.getBalancePromise(Alice);
    let BobBalance = await web3.eth.getBalancePromise(Bob);
    let CarolBalance = await web3.eth.getBalancePromise(Carol);

    //
    let splitTransaction = await splitter.split(Bob, Carol, { from: Alice, value: 10 });
    let splitTransactionFee = await calculateTransactionFee(splitTransaction);

    // Alice balance
    let AliceBalanceFinal = await web3.eth.getBalancePromise(Alice);
    assert.equal(AliceBalanceFinal.plus(splitTransactionFee).plus(10).toString(), AliceBalance.toString());

    // Bob and Carol should has 5 weis, but store in smart contract state
    let BobBalanceState = await splitter.getBalance(Bob);
    assert.equal(5, BobBalanceState);

    let CarolBalanceState = await splitter.getBalance(Carol);
    assert.equal(5, CarolBalanceState);

    // after withdraw, Bob and Carol can take their money back
    let BobWithdrawSimulate = await splitter.withdraw.call({ from: Bob });
    assert.equal(true, BobWithdrawSimulate);

    let BobWithdrawTransaction = await splitter.withdraw({ from: Bob });
    let BobWithdrawTransactionFee = await calculateTransactionFee(BobWithdrawTransaction);
    let BobBalanceFinal = await web3.eth.getBalancePromise(Bob);
    assert.equal(BobBalanceFinal.plus(BobWithdrawTransactionFee).minus(BobBalance).abs().toString(), '5');

    let CarolWithdrawSimulate = await splitter.withdraw.call({ from: Carol });
    assert.equal(true, CarolWithdrawSimulate);

    let CarolWithdrawTransaction = await splitter.withdraw({ from: Carol });
    let CarolWithdrawTransactionFee = await calculateTransactionFee(CarolWithdrawTransaction);
    let CarolBalanceFinal = await web3.eth.getBalancePromise(Carol);
    assert.equal(CarolBalanceFinal.plus(CarolWithdrawTransactionFee).minus(CarolBalance).toString(), '5');
  })

  it('split 9 weis to two difference address', async () => {
    let splitter = await Splitter.deployed();

    let [Alice, Bob, Carol] = accounts;

    // initial balance
    let AliceBalance = await web3.eth.getBalance(Alice);
    let BobBalance = await web3.eth.getBalance(Bob);
    let CarolBalance = await web3.eth.getBalance(Carol);

    //
    let splitTransaction = await splitter.split(Bob, Carol, { from: Alice, value: 9 });
    let splitTransactionFee = await calculateTransactionFee(splitTransaction);

    // Alice balance
    let AliceBalanceFinal = await web3.eth.getBalancePromise(Alice);
    assert.equal(AliceBalanceFinal.plus(splitTransactionFee).plus(8).toString(), AliceBalance.toString());

    // actually, Alice sent 8 weis to other address
    // so, Bob and Carol should has 4 weis, but store in smart contract state
    let BobBalanceState = await splitter.getBalance(Bob);
    assert.equal(4, BobBalanceState);

    let CarolBalanceState = await splitter.getBalance(Carol);
    assert.equal(4, CarolBalanceState);

    // after withdraw, Bob and Carol can take their money back
    let BobWithdrawSimulate = await splitter.withdraw.call({ from: Bob });
    assert.equal(true, BobWithdrawSimulate);

    let BobWithdrawTransaction = await splitter.withdraw({ from: Bob });
    let BobWithdrawTransactionFee = await calculateTransactionFee(BobWithdrawTransaction);
    let BobBalanceFinal = await web3.eth.getBalancePromise(Bob);
    assert.equal(BobBalanceFinal.plus(BobWithdrawTransactionFee).minus(BobBalance).abs().toString(), '4');

    let CarolWithdrawSimulate = await splitter.withdraw.call({ from: Carol });
    assert.equal(true, CarolWithdrawSimulate);

    let CarolWithdrawTransaction = await splitter.withdraw({ from: Carol });
    let CarolWithdrawTransactionFee = await calculateTransactionFee(CarolWithdrawTransaction);
    let CarolBalanceFinal = await web3.eth.getBalancePromise(Carol);
    assert.equal(CarolBalanceFinal.plus(CarolWithdrawTransactionFee).minus(CarolBalance).toString(), '4');
  })
})