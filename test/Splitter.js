var Splitter = artifacts.require("Splitter");

contract('Splitter', async (accounts) => {

  it('receive hello world string', async () => {
    let splitter = await Splitter.deployed();
    let result = await splitter.say.call('hello world');
    assert.equal(result, 'hello world');
  })
})