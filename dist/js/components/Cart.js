import { settings, select, classNames, templates } from "../settings.js";
import utils from '../utils.js';
import CartProduct from "./CartProduct.js";

class Cart {
    constructor(element){
      const thisCart = this;

      thisCart.products = [];

      thisCart.getElements(element);
      thisCart.initActions();

      // console.log('New Cart', thisCart);
    }

    getElements(element){
      const thisCart = this;

      thisCart.dom = {};

      thisCart.dom.wrapper = element;

      thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
      thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
      
      thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(select.cart.deliveryFee);
      thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(select.cart.totalNumber);
      thisCart.dom.subtotalPrice = thisCart.dom.wrapper.querySelector(select.cart.subtotalPrice);
      thisCart.dom.totalPrice = thisCart.dom.wrapper.querySelector(select.cart.totalPrice);
      thisCart.dom.totalPriceRepeated = thisCart.dom.wrapper.querySelector(select.cart.totalPriceRepeated);
      thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);

      thisCart.dom.phone = thisCart.dom.wrapper.querySelector(select.cart.phone);
      thisCart.dom.address = thisCart.dom.wrapper.querySelector(select.cart.address);
    }

    initActions(){
      const thisCart = this;

      thisCart.dom.toggleTrigger.addEventListener('click', function(event){
        event.preventDefault();

        thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
      })

      thisCart.dom.productList.addEventListener('updated', function(){
        thisCart.update();
      })

      thisCart.dom.productList.addEventListener('remove', function(event){
        thisCart.remove(event.detail.cartProduct);
      })

      thisCart.dom.form.addEventListener('submit', function(event){
        event.preventDefault();
        thisCart.sendOrder();
      })
    }

    add(menuProduct){
      const thisCart = this;

      // console.log('Adding product', menuProduct);

      //generate html based on template
      const generatedHTML = templates.cartProduct(menuProduct);
      // console.log(generatedHTML);

      // thisCart.element = utils.createDOMFromHTML(generatedHTML);
      // console.log(thisCart.element);
      
      const generatedDOM = utils.createDOMFromHTML(generatedHTML);
      // console.log(generatedDOM)

      thisCart.dom.productList.appendChild(generatedDOM);

      thisCart.products.push(new CartProduct(menuProduct, generatedDOM));
      // console.log('Products in cart: ', thisCart.products);
      // console.log(menuProduct);

      thisCart.update();
    }

    update(){
      const thisCart = this;

      const deliveryFee = settings.cart.defaultDeliveryFee;

      let totalNumber = 0;
      let subtotalPrice = 0;

      console.log(thisCart.products);

      for (let product of thisCart.products) {
        totalNumber += product.amount;
        subtotalPrice += product.price;
      }

      if(totalNumber > 0 && totalNumber <= 3){
        thisCart.totalPrice = subtotalPrice + deliveryFee;
        thisCart.dom.deliveryFee.innerHTML = deliveryFee;
        // Free delivery fee above 3 totalNumber
      } else if (totalNumber > 3) {
        thisCart.totalPrice = subtotalPrice;
        thisCart.dom.deliveryFee.innerHTML = "0";
      } else {
        thisCart.totalPrice = 0;
        thisCart.dom.deliveryFee.innerHTML = 0;
      }
      
      thisCart.dom.subtotalPrice.innerHTML = subtotalPrice;
      thisCart.dom.totalNumber.innerHTML = totalNumber;

      // if(totalNumber > 0){
      //   thisCart.dom.deliveryFee.innerHTML = deliveryFee; 
      // } else {
      //   thisCart.dom.deliveryFee.innerHTML = 0;
      // }

      thisCart.dom.totalPrice.innerHTML = thisCart.totalPrice;
      thisCart.dom.totalPriceRepeated.innerHTML = thisCart.totalPrice;

      // console.log('Delivery fee: ', deliveryFee, 'totalNumber: ', totalNumber, 'subtotalPrice: ', subtotalPrice, 'thisCart.totalPrice: ', thisCart.totalPrice);
    }

    remove(removedProduct){
      const thisCart = this;

      const indexOfRemovedProduct = thisCart.products.indexOf(removedProduct);
      thisCart.products.splice(indexOfRemovedProduct, 1);

      const productToRemove = removedProduct.dom.wrapper;
      productToRemove.remove();
      

      thisCart.update();

      // console.log(indexOfRemovedProduct);
      // console.log(removedProduct);
      // console.log(productToRemove);
      // console.log(thisCart);
    }

    sendOrder(){
      const thisCart = this;

      const url = settings.db.url + '/' + settings.db.orders;

      const payload = {
        address: thisCart.dom.address.value,
        phone: thisCart.dom.phone.value,
        totalPrice: thisCart.totalPrice,
        subtotalPrice: Number(thisCart.dom.subtotalPrice.innerHTML),
        totalNumber: Number(thisCart.dom.totalNumber.innerHTML),
        deliveryFee: Number(thisCart.dom.deliveryFee.innerHTML),
        products: []
      };

      for(let prod of thisCart.products) {
        payload.products.push(prod.getData());
      }

      // console.log(payload);

      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      };
      
      fetch(url, options);
    }
  }

  export default Cart;