class Home {
    constructor(sliderSelector) {
        const thisHome = this;
        thisHome.sliderSelector = sliderSelector; // Przechowujemy selektor slidera
        thisHome.slider = null;                   // Obiekt Flickity
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