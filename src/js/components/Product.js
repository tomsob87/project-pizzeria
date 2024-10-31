import { select, classNames, templates } from "../settings.js";
import { utils } from "../utils.js";
import AmountWidget from "./AmountWidget.js";

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

    addToCart() {
        const thisProduct = this;
     
        //  app.cart.add(thisProduct.prepareCartProduct());
        const event = new CustomEvent('add-to-cart', {
          bubbles: true,
          detail: {
            product: thisProduct.prepareCartProduct(),
          },
        }
        );
        thisProduct.element.dispatchEvent(event);
     }


    //   app.cart.add(thisProduct.prepareCartProduct());

  }

  export default Product;