const { expect } = require("chai")

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe("Dappazon", () => {
  let dappazon;
  let deployer, buyer;

  // before hooks
  beforeEach(async () => {
    // setup accounts 
    // await ethers.getSigners() gives an array of a vm that is spun up quickly as a test
    // npx hardhat node creates a blockchain for us

    [deployer, buyer] = await ethers.getSigners()
    // console.log(deployer.address, buyer.address)
    
    // will run before every test 
    const Dappazon = await ethers.getContractFactory('Dappazon');
    dappazon = await Dappazon.deploy() 
    // have to deploy contract first



  })

  describe('Deployment', () => {
    it('sets the owner', async () =>{
      expect(await dappazon.owner()).to.equal(deployer.address)
    })

      it('Has a name', async  () => {
        // can save name or just pass await dappazon.name() to expect function 
        const name = await dappazon.name()
        // expect function is waiting for name to equal that value
        expect(name).to.equal('Dappazon')
    })    
  })

  
  describe('Listing', () => {
    let transaction;

    const ID = 1
    const NAME = 'Shoes'
    const CATEGORY = 'Clothing'
    const IMAGE = "https://ipfs.io/ipfs/QmTYEboq8raiBs7GTUg2yLXB3PMz6HuBNgNfSZBx5Msztg/shoes.jpg"
    const COST = tokens(1)
    const RATING = 4
    const STOCK = 5

    // will add item before each test to make sure it is filled
    beforeEach(async () => {
      transaction = await dappazon.connect(deployer).list(
        ID,
        NAME, 
        CATEGORY, 
        IMAGE, 
        COST, 
        RATING, 
        STOCK
      )
      await transaction.wait()
    })
    it('Returns item attributes', async () =>{
      const item = await dappazon.items(1)
      
      // will check individually if the item was added.
      expect(item.id).to.equal(ID)
      expect(item.name).to.equal(NAME);
      expect(item.category).to.equal(CATEGORY);
      expect(item.image).to.equal(IMAGE)
      expect(item.cost).to.equal(COST);
      expect(item.rating).to.equal(RATING);
      expect(item.stock).to.equal(STOCK)

    })

    it('Emits list events', () => {
      // checks if the event is emitted from the contract
      expect(transaction).to.emit(dappazon, 'List')
    })
})

  describe('Buying', () => {
    const ID = 1
    const NAME = 'Shoes'
    const CATEGORY = 'Clothing'
    const IMAGE = "https://ipfs.io/ipfs/QmTYEboq8raiBs7GTUg2yLXB3PMz6HuBNgNfSZBx5Msztg/shoes.jpg"
    const COST = tokens(1)
    const RATING = 4
    const STOCK = 5
    let transaction;

    beforeEach(async () => {
      // list an item
      transaction = await dappazon.connect(deployer).list(ID, NAME, CATEGORY, IMAGE, COST, RATING, STOCK)
      await transaction.wait()

      // buy an item 
      transaction = await dappazon.connect(buyer).buy(ID, {value: COST})
      await transaction.wait()
    })


    it('updates the contract balance', async () => {
      const result = await ethers.provider.getBalance(dappazon.address)
      // console.log(result)
      expect(result).to.equal(COST)
    })


    it('updates buyers order count', async () => {
      const result = await dappazon.orderCount(buyer.address)
      expect(result).to.equal(1)
    })

    it('Adds the order', async () => {
      const order = await dappazon.orders(buyer.address, 1)

      expect(order.time).to.be.greaterThan(0)
      expect(order.item.name).to.equal(NAME)
    })
    it('Emits buy event', () => {
      expect(transaction).to.emit(dappazon, 'Buy');
    })

  })
  describe("Withdrawing", () => {
    const ID = 1
    const NAME = 'Shoes'
    const CATEGORY = 'Clothing'
    const IMAGE = "https://ipfs.io/ipfs/QmTYEboq8raiBs7GTUg2yLXB3PMz6HuBNgNfSZBx5Msztg/shoes.jpg"
    const COST = tokens(1)
    const RATING = 4
    const STOCK = 5
    let balanceBefore

    beforeEach(async () => {
      // List a item
      let transaction = await dappazon.connect(deployer).list(ID, NAME, CATEGORY, IMAGE, COST, RATING, STOCK)
      await transaction.wait()

      // Buy a item
      transaction = await dappazon.connect(buyer).buy(ID, { value: COST })
      await transaction.wait()

      // Get Deployer balance before
      balanceBefore = await ethers.provider.getBalance(deployer.address)

      // Withdraw
      transaction = await dappazon.connect(deployer).withdraw()
      await transaction.wait()
    })

    it('Updates the owner balance', async () => {
      const balanceAfter = await ethers.provider.getBalance(deployer.address)
      expect(balanceAfter).to.be.greaterThan(balanceBefore)
    })

    it('Updates the contract balance', async () => {
      const result = await ethers.provider.getBalance(dappazon.address)
      expect(result).to.equal(0)
    })
  })

})
