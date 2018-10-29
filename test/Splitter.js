import { default as Promise } from 'bluebird';
const Splitter = artifacts.require("Splitter");

Promise.promisifyAll(web3.eth, { suffix: 'Promise' });

const calculateTransactionFee = async (transaction) => {
  let tx = await web3.eth.getTransactionPromise(transaction.tx);
  return tx.gasPrice.mul(transaction.receipt.gasUsed);
}

contract('Splitter', async (accounts) => {

  const [alice, bob, carol] = accounts;
  let splitter;

  beforeEach('Deploy new contract instance', async () => {
    splitter = await Splitter.new({ from: alice });
  });

  describe('.amountCheck(): check amount should great than zero', async () => {
    //
    let dataProvider = {
      'should be false when give 0': {
        data: {
          amount: 0
        },
        expected: false
      },
      'should be true when give 1': {
        data: {
          amount: 1
        },
        expected: true
      }
    };

    // testing all test case data
    for (let [describe, testCase] of Object.entries(dataProvider)) {
      it(describe, async function () {
        let result = await splitter.amountCheck.call(testCase.data.amount);
        assert.equal(result, testCase.expected);
      });
    }
  });

  describe('.getDivided(): calculate how many numbers that sender can take them back', async () => {
    //
    let dataProvider = {
      'should calculate sender can take 1 back, and others can get 0': {
        data: {
          amount: 1,
          divide: 2
        },
        expected: {
          quotient: 0,
          remainder: 1
        }
      },
      'should calculate sender can take 0 back, and others can get 1': {
        data: {
          amount: 2,
          divide: 2
        },
        expected: {
          quotient: 1,
          remainder: 0
        }
      }
    };

    // testing all test case
    for (let [describe, testCase] of Object.entries(dataProvider)) {
      it(describe, async function () {
        let quotient, remainder;
        [quotient, remainder] = await splitter.getDivided.call(testCase.data.amount, testCase.data.divide);

        assert.equal(quotient, testCase.expected.quotient);
        assert.equal(remainder, testCase.expected.remainder);
      });
    }
  });

  describe('.split(): sender send some weis and expend some gas', async () => {
    let dataProvider = {
      'alice should send 10 weis': {
        data: {
          amount: 10,
        },
        expected: {
          simulate: true,
          exactlySend: 10
        }
      },
      'alice should send 8 weis': {
        data: {
          amount: 9,
        },
        expected: {
          simulate: true,
          exactlySend: 8
        }
      },
    };

    // testing all test case
    for (let [describe, testCase] of Object.entries(dataProvider)) {
      it(describe, async function () {
        let simulate = await splitter.split.call(bob, carol, { from: alice, value: testCase.data.amount });
        assert.equal(simulate, testCase.expected.simulate);

        let aliceBalance = await web3.eth.getBalancePromise(alice);
        let splitTransaction = await splitter.split(bob, carol, { from: alice, value: testCase.data.amount });
        let splitTransactionFee = await calculateTransactionFee(splitTransaction);
        let aliceBalanceFinal = await web3.eth.getBalancePromise(alice);
        assert.equal(aliceBalanceFinal.plus(splitTransactionFee).plus(testCase.expected.exactlySend).toString(), aliceBalance.toString());
      });
    }
  })

  describe('.getBalance(): receiver get their balance that store in the contract', async () => {
    let dataProvider = {
      'receiver has 5 weis that store in the contract ': {
        data: {
          receivers: [bob, carol],
          aliceSendAmount: 10,
        },
        expected: {
          storeInContract: 5,
        }
      },
      'receiver has 4 weis that store in the contract ': {
        data: {
          receivers: [bob, carol],
          aliceSendAmount: 9,
        },
        expected: {
          storeInContract: 4,
        }
      }
    };
    // testing all test case
    for (let [describe, testCase] of Object.entries(dataProvider)) {
      it(describe, async function () {
        let [bob, carol] = testCase.data.receivers;
        await splitter.split(bob, carol, { from: alice, value: testCase.data.aliceSendAmount });

        // check every receivers
        testCase.data.receivers.forEach(async function(receiver) {
          let receiverBalanceState = await splitter.getBalance(receiver);
          assert.equal(receiverBalanceState, testCase.expected.storeInContract);
        });
      });
    }
  });

  describe('.withdraw.call(): receiver simulate withdraw', async () => {
    let dataProvider = {
      'simulate withdraw should be true when send 10 weis': {
        data: {
          receivers: [bob, carol],
          aliceSendAmount: 10,
        },
        expected: {
          simulate: true,
        }
      },
      'simulate withdraw should be true when send 9 weis ': {
        data: {
          receivers: [bob, carol],
          aliceSendAmount: 9,
        },
        expected: {
          simulate: true,
        }
      },
    };

    // testing all test case data
    for (let [describe, testCase] of Object.entries(dataProvider)) {
      it(describe, async function () {
        let [bob, carol] = testCase.data.receivers;
        await splitter.split(bob, carol, { from: alice, value: testCase.data.aliceSendAmount });

        // check every receivers
        testCase.data.receivers.forEach(async function(receiver) {
          let simulate = await splitter.withdraw.call({ from: receiver });
          assert.equal(simulate, testCase.expected.simulate);
        });
      });
    }
  });

  describe('.withdraw(): receivers should get weis via invoke withdraw and expend some gas', async () => {
    let dataProvider = {
      'should receive 5 weis and expend some gas': {
        data: {
          receivers: [bob, carol],
          aliceSendAmount: 10,
        },
        expected: {
          exactlyGet: 5
        }
      },
      'should receive 4 weis and expend some gas': {
        data: {
          receivers: [bob, carol],
          aliceSendAmount: 9,
        },
        expected: {
          exactlyGet: 4
        }
      }
    };

    // testing all test case
    for (let [describe, testCase] of Object.entries(dataProvider)) {
      it(describe, async function () {
        let [bob, carol] = testCase.data.receivers;
        await splitter.split(bob, carol, { from: alice, value: testCase.data.aliceSendAmount });

        // check every receivers
        testCase.data.receivers.forEach(async function(receiver) {
          let receiverBalance = await web3.eth.getBalancePromise(receiver);
          let receiverWithdrawTransaction = await splitter.withdraw({ from: receiver });
          let receiverWithdrawTransactionFee = await calculateTransactionFee(receiverWithdrawTransaction);
          let receiverBalanceFinal = await web3.eth.getBalancePromise(receiver);
          assert.equal(receiverBalanceFinal.plus(receiverWithdrawTransactionFee).minus(receiverBalance).abs().toString(), testCase.expected.exactlyGet);
        });
      });
    }
  });

  describe('.say(): hello world test', async () => {
    it('receive hello world string', async () => {
      let result = await splitter.say.call('hello world');
      assert.equal(result, 'hello world');
    })
  })
})