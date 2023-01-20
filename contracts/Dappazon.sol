// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9; 

contract Dappazon {
    string public name; 
    address public owner; 

    // id will point to the item that is being shown.
    mapping(uint256 => Item) public items;
    mapping(address => uint256) public orderCount;
    mapping(address => mapping(uint256 => Order)) public orders;

    event List(string name, uint256 cost, uint256 quantity);
    event Buy(address buyer, uint256 orderId, uint256 itemId);

    struct Item {
        uint256 id;
        string name;
        string category;
        string image; 
        uint256 cost;
        uint256 rating;
        uint256 stock;
    }

    struct Order {
        uint256 time; 
        Item item;
    }

    modifier onlyOwner(){ // can also import onlyOwner from zeppelin library
            require(msg.sender == owner);
            _; // requires _; to finish and continue logic
    }

    constructor() {
        name = 'Dappazon';
        // msg.sender will be the initial person who created the smart contract
        owner = msg.sender;
    }


    // list products 
    function list(
        uint256 _id,
        string memory _name,
        string memory _category,
        string memory _image, 
        uint256 _cost, 
        uint256 _rating,
        uint256 _stock
          ) public onlyOwner {
            // code goes here... 
            

            // create item struct 
            Item memory item = Item(_id, _name, _category, _image, _cost, _rating, _stock);
            // save item struct to blockchain
            // we map it to the blockchain to save it. 

            // save item to the mapping of items this is the easiest way to do it with a struct
            items[_id] = item;

            // emit the event to listen to it on the frontend
            emit List(_name, _cost, _stock);
    }

    // buy products 

    function buy(uint256 _id) payable public {
        // fetch item from mapping 
        Item memory item = items[_id];

        // search for item first then see if enough is sent and the item is in stock
        require(msg.value >= item.cost);

        require(item.stock >= 0);

        // create an order 
        // each order has a unique timestamp from when it was created
        // we use epoch time for timestamps/ current time in seconds since jan 1 1970
        Order memory order = Order(block.timestamp, item);

        // save order to the blockchain
        // will keep track of order number bought by that address
        orderCount[msg.sender]++;
        orders[msg.sender][orderCount[msg.sender]] = order;
        // subtract stock 
        items[_id].stock = item.stock -1;

        // emit event
        emit Buy(msg.sender, orderCount[msg.sender], item.id);
    }

    // withdraw funds for the owner 

    function withdraw() public onlyOwner {
        // can use transfer function but instead we use .call because it sends a message with value in it. 
        (bool success,) = owner.call{value: address(this).balance}("Fund the Venture");
        require(success);
    }
}
