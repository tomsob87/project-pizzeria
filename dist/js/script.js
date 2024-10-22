/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
      cartProduct: '#template-cart-product', // CODE ADDED
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input.amount', // CODE CHANGED
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
    // CODE ADDED START
    cart: {
      productList: '.cart__order-summary',
      toggleTrigger: '.cart__summary',
      totalNumber: `.cart__total-number`,
      totalPrice: '.cart__total-price strong',
      totalPriceRepeated: '.cart__order-total .cart__order-price-sum strong',
      subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
      deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
      form: '.cart__order',
      formSubmit: '.cart__order [type="submit"]',
      phone: '[name="phone"]',
      address: '[name="address"]',
    },
    cartProduct: {
      amountWidget: '.widget-amount',
      price: '.cart__product-price',
      edit: '[href="#edit"]',
      remove: '[href="#remove"]',
    },
    // CODE ADDED END
  };
  
  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
    // CODE ADDED START
    cart: {
      wrapperActive: 'active',
    },
    // CODE ADDED END
  };
  
  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    }, // CODE CHANGED
    // CODE ADDED START
    cart: {
      defaultDeliveryFee: 20,
    },
    // CODE ADDED END
  };
  
  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
    // CODE ADDED START
    cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
    // CODE ADDED END
  };

  class Product {
    constructor(id, data){
      const thisProduct = this;

      thisProduct.id = id;
      thisProduct.data = data;

      thisProduct.renderInMenu();
      thisProduct.getElements();
      thisProduct.initAccordion();
      thisProduct.initOrderForm();
      thisProduct.initAmountWidget();
      thisProduct.processOrder();

      // console.log('new Product: ', thisProduct);
    }

    renderInMenu(){
      const thisProduct = this;

      // generate HTML based on template
      const generatedHTML = templates.menuProduct(thisProduct.data);
      // create element using utilis.createElementFromHTML
      thisProduct.element = utils.createDOMFromHTML(generatedHTML);
      // find menu container
      const menuContainer = document.querySelector(select.containerOf.menu);
      // add element to menu
      menuContainer.appendChild(thisProduct.element);
    }

    getElements(){
      const thisProduct = this;
      
      thisProduct.dom = {};
      // console.log(thisProduct.dom);

      thisProduct.dom.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
      thisProduct.dom.form = thisProduct.element.querySelector(select.menuProduct.form);
      thisProduct.dom.formInputs = thisProduct.dom.form.querySelectorAll(select.all.formInputs);
      thisProduct.dom.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
      thisProduct.dom.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
      thisProduct.dom.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
      thisProduct.dom.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);

      // thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
      // thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
      // thisProduct.formInputs = thisProduct.dom.form.querySelectorAll(select.all.formInputs);
      // thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
      // thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
      // thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
      // thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
    }

    initAccordion(){
      const thisProduct = this;

      /* find the clickable trigger (the element that should react to clicking) */
      // const clickableTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
      
       /* START: add event listener to clickable trigger on event click */
       thisProduct.dom.accordionTrigger.addEventListener('click', function(event) {
        
        /* prevent default action for event */
        event.preventDefault();

        /* find active product (product that has active class) */
        const activeProduct = document.querySelector(select.all.menuProductsActive);
        // console.log('to jest', activeProduct);

        /* if there is active product and it's not thisProduct.element, remove class active from it */
        if(activeProduct && activeProduct != thisProduct.element) {
          activeProduct.classList.remove('active');
        }
        
        /* toggle active class on thisProduct.element */
        thisProduct.element.classList.toggle('active');
      });
    }

    initOrderForm(){
      const thisProduct = this;

      thisProduct.dom.form.addEventListener('submit', function(event){
        event.preventDefault();
        thisProduct.processOrder();
      });
      
      for(let input of thisProduct.dom.formInputs){
        input.addEventListener('change', function(){
          thisProduct.processOrder();
        });
      }
      
      thisProduct.dom.cartButton.addEventListener('click', function(event){
        event.preventDefault();
        thisProduct.processOrder();
        thisProduct.addToCart();
      });
    }

    initAmountWidget(){
      const thisProduct =this;

      thisProduct.amountWidget = new AmountWidget(thisProduct.dom.amountWidgetElem);

      thisProduct.dom.amountWidgetElem.addEventListener('updated', function(){
        thisProduct.processOrder();
      })
    }

    processOrder() {
      const thisProduct = this;
    
      // covert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
      const formData = utils.serializeFormToObject(thisProduct.dom.form);
      // console.log('formData', formData);
    
      // set price to default price
      let price = thisProduct.data.price;
    
      // for every category (param)...
      for(let paramId in thisProduct.data.params) {
        // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
        const param = thisProduct.data.params[paramId];
        // console.log(paramId, param);
    
        // for every option in this category
        for(let optionId in param.options) {
          // determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
          const option = param.options[optionId];
          const selectedOption = formData[paramId] && formData[paramId].includes(optionId);
          const selectedOptionImage = thisProduct.dom.imageWrapper.querySelector('.' + paramId + '-' + optionId);   
          

          if(selectedOption){
            if(!option.default){
              price += option.price;
              // console.log("Dodano dodatek, cena wzrasta o: ", option.price, "$");
            }
          }
          else if(option.default) {
            price -= option.price;
            // console.log("Odjęto dodatek, cena maleje o: ", option.price, "$");
          }

          if(selectedOptionImage) {
            if(selectedOption) {
              selectedOptionImage.classList.add(classNames.menuProduct.imageVisible);
            }
            else if(!selectedOption) {
              selectedOptionImage.classList.remove(classNames.menuProduct.imageVisible);
            }
          }
        }        
      }

      thisProduct.priceSingle = price;
      // console.log(thisProduct.priceSingle);

      // multiply price by amount
      price *= this.amountWidget.value;

      // update calculated price in the HTML
      thisProduct.dom.priceElem.innerHTML = price;
    }

    prepareCartProductParams(){
      const thisProduct = this;
    
      // covert form to object structure
      const formData = utils.serializeFormToObject(thisProduct.dom.form);
    
      const params = {};
      
      // for every category (param)...
      for(let paramId in thisProduct.data.params) {
        // determine param value
        const param = thisProduct.data.params[paramId];
    
        // create category param in params const
        params[paramId] = {
          label: param.label,
          options: {}
        }

        // for every option in this category
        for(let optionId in param.options) {
          // determine option value
          const option = param.options[optionId];
          const selectedOption = formData[paramId] && formData[paramId].includes(optionId);

         if(selectedOption){
            params[paramId].options[optionId] = option.label;
          } 
        }        
      }

      return params;
    }

    prepareCartProduct(){
      const thisProduct = this;

      const productSummary = {
        id: thisProduct.id,
        name: thisProduct.data.name,
        amount: thisProduct.amountWidget.value,
        priceSingle: thisProduct.priceSingle,
        price: thisProduct.priceSingle * thisProduct.amountWidget.value,

        params: thisProduct.prepareCartProductParams(),
      };

      return productSummary;
    }

    addToCart(){
      const thisProduct = this;

      app.cart.add(thisProduct.prepareCartProduct());
    }

  }

  class AmountWidget {
    constructor(element) {
      const thisWidget = this;

      // console.log('AmountWidget: ', thisWidget);
      // console.log('Constructor arguments: ', element);

      thisWidget.getElements(element);
      // thisWidget.setValue(thisWidget.input.value);

      if(!isNaN(thisWidget.input.value)) {
        thisWidget.setValue(thisWidget.input.value);
      } 
      
      if(isNaN(thisWidget.input.value)){
        thisWidget.setValue(thisWidget.value = settings.amountWidget.defaultValue);
      }

      thisWidget.initActions();
    }

    getElements(element){
      const thisWidget = this;
      // console.log(thisWidget);
    
      thisWidget.element = element;
      thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
      thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
      thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);
    }

    setValue(value){
      const thisWidget = this;

      const newValue = parseInt(value);

      // ToDo Add Validation
      if(newValue !== thisWidget.value && !isNaN(newValue) && newValue >= settings.amountWidget.defaultMin && newValue <= settings.amountWidget.defaultMax){
        thisWidget.value = newValue;
      }

      thisWidget.input.value = thisWidget.value;

      thisWidget.announce();
    }

    initActions(){
      const thisWidget = this;
      
      thisWidget.input.addEventListener('change', function(){
        thisWidget.setValue(thisWidget.input.value);
      })

      thisWidget.linkDecrease.addEventListener('click', function(event){
        event.preventDefault();
        thisWidget.setValue(thisWidget.value - 1);
      })

      thisWidget.linkIncrease.addEventListener('click', function(event){
        event.preventDefault();
        thisWidget.setValue(thisWidget.value + 1);
      })
    }

    announce(){
      const thisWidget = this;

      const event = new CustomEvent('updated', {
        bubbles: true
      });
      thisWidget.element.dispatchEvent(event);
    }
  }

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

      // console.log(thisCart.products);

      for (let product of thisCart.products) {
        totalNumber += product.amount;
        subtotalPrice += product.price;
      }

      if(totalNumber > 0){
        thisCart.totalPrice = subtotalPrice + deliveryFee;
        thisCart.dom.deliveryFee.innerHTML = deliveryFee;
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
  }

  class CartProduct {
    constructor(menuProduct, element){
      const thisCartProduct = this;

      thisCartProduct.id = menuProduct.id;
      thisCartProduct.amount = menuProduct.amount;
      thisCartProduct.name= menuProduct.name;
      thisCartProduct.price = menuProduct.price;
      thisCartProduct.priceSingle = menuProduct.priceSingle;
      thisCartProduct.params = menuProduct.params;

      thisCartProduct.getElements(element);
      thisCartProduct.initAmountWidget();
      thisCartProduct.initActions();

      // console.log('thisCartProduct', thisCartProduct);
    }

    getElements(element){
      const thisCartProduct = this;

      thisCartProduct.dom = {};

      thisCartProduct.dom.wrapper = element;

      thisCartProduct.dom.amountWidget = element.querySelector(select.cartProduct.amountWidget);
      thisCartProduct.dom.price = element.querySelector(select.cartProduct.price);
      thisCartProduct.dom.edit = element.querySelector(select.cartProduct.edit);
      thisCartProduct.dom.remove = element.querySelector(select.cartProduct.remove);
    }

    initAmountWidget(){
      const thisCartProduct =this;

      thisCartProduct.amountWidget = new AmountWidget(thisCartProduct.dom.amountWidget);

      thisCartProduct.dom.amountWidget.addEventListener('updated', function(){
        thisCartProduct.amount = thisCartProduct.amountWidget.value;
        thisCartProduct.price = thisCartProduct.amountWidget.value * thisCartProduct.priceSingle;
        thisCartProduct.dom.price.innerHTML = thisCartProduct.price;

        // console.log(thisCartProduct.amountWidget.value);
        // console.log(thisCartProduct.price);
      })
    }

    initActions(){
      const thisCartProduct = this;

      thisCartProduct.dom.edit.addEventListener('click', function(event) {
        event.preventDefault();
      })
      thisCartProduct.dom.remove.addEventListener('click', function(event){
        event.preventDefault();
        thisCartProduct.remove();
      })
    }

    remove(){
      const thisCartProduct = this;

      const event = new CustomEvent('remove', {
        bubbles: true,
        detail: {
          cartProduct: thisCartProduct,
        },
      });

      thisCartProduct.dom.wrapper.dispatchEvent(event);
    }
  }

  const app = {
    initMenu: function(){
      const thisApp = this;

      // console.log('thisApp.data', thisApp.data);
      
      for(let productData in thisApp.data.products){
        new Product(productData, thisApp.data.products[productData]);
      }
    },

    initData: function(){
      const thisApp = this;

      thisApp.data = dataSource;
    },

    init: function(){
      const thisApp = this;
      // console.log('*** App starting ***');
      // console.log('thisApp:', thisApp);
      // console.log('classNames:', classNames);
      // console.log('settings:', settings);
      // console.log('templates:', templates);
      thisApp.initData();
      thisApp.initMenu();
      thisApp.initCart();
    },

    initCart: function(){
      const thisApp = this;

      const cartElem = document.querySelector(select.containerOf.cart);
      thisApp.cart = new Cart(cartElem);
    }

  };

  app.init();
}
