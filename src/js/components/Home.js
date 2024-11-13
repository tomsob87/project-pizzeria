import { classNames, select, templates } from "../settings.js"; 

class Home {
    constructor(sliderSelector) {
        const thisHome = this;

        thisHome.sliderSelector = sliderSelector;
        thisHome.slider = null;

        thisHome.render();
    }

    render(){
        const thisHome = this;

        const generatedHTML = templates.homepage();
        
        thisHome.dom = {};
        thisHome.dom.wrapper = document.querySelector(select.containerOf.home);
        
        thisHome.dom.wrapper.innerHTML = generatedHTML;
        // console.log(thisHome.dom.wrapper.innerHTML)

        thisHome.dom.homeNav = thisHome.dom.wrapper.querySelector(select.nav.homeNav);
        thisHome.dom.order = thisHome.dom.wrapper.querySelector(select.nav.homeOrder);
        thisHome.dom.booking = thisHome.dom.wrapper.querySelector(select.nav.homeBooking);


        thisHome.dom.homeNav.addEventListener('click', function(event){

            const orderButton = event.target.closest(select.nav.homeOrder);
            const bookButton = event.target.closest(select.nav.homeBooking);
            const homePage = document.getElementById('home');
            const linkHome = document.querySelector(select.nav.linkHome)
            const linkOrder = document.querySelector(select.nav.linkOrder);
            const linkBooking = document.querySelector(select.nav.linkBooking);

            if(orderButton) {
                const orderPage = document.getElementById('order');

                orderPage.classList.add(classNames.pages.active)
                homePage.classList.remove(classNames.pages.active);

                linkOrder.classList.add(classNames.pages.active)
                linkHome.classList.remove(classNames.pages.active)

            } 

            if(bookButton) {
                const bookPage = document.getElementById('booking');
                
                bookPage.classList.add(classNames.pages.active);
                homePage.classList.remove(classNames.pages.active);

                linkBooking.classList.add(classNames.pages.active)
                linkHome.classList.remove(classNames.pages.active)
            }

        })

    }

    initWidgets() {
        const thisHome = this;

        // eslint-disable-next-line no-undef
        thisHome.slider = new Flickity(thisHome.sliderSelector, {
            cellAlign: 'center',
            contain: true,
            wrapAround: true,
            autoPlay: 3000,
            prevNextButtons: false,
            pageDots: true,
        });

        
    }
}

// Udostępnienie klasy Home do użycia w app.js
export default Home;