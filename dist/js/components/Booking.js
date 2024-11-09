import { select, templates, settings, classNames } from "../settings.js";
import AmountWidget from "./AmountWidget.js";
import DatePicker from "./DatePicker.js"
import HourPicker from "./HourPicker.js";
import utils from "../utils.js";


class Booking {
    constructor(element) {
        const thisBooking =this;

        thisBooking.pickedTable = null;

        thisBooking.render(element);
        thisBooking.initWidgets();
        thisBooking.getData();
        thisBooking.pickTable();
    }

    getData(){
        const thisBooking = this;

        const startDateParam = settings.db.dateStartParamKey + '=' +  utils.dateToStr(thisBooking.datePicker.minDate);
        const endDateParam = settings.db.dateEndParamKey + '=' +  utils.dateToStr(thisBooking.datePicker.maxDate);

        const params = {
            booking: [
                startDateParam,
                endDateParam,
            ],
            eventsCurrent: [
                settings.db.notRepeatParam,
                startDateParam,
                endDateParam,
            ],
                eventsRepeat: [
                settings.db.repeatParam,
                endDateParam,
            ],
        };

        // console.log('getData params: ', params);

        const urls = {
            booking: settings.db.url + '/' + settings.db.bookings + '?' + params.booking.join('&'),
            eventsCurrent: settings.db.url + '/' + settings.db.events + '?' + params.eventsCurrent.join('&'),
            eventsRepeat: settings.db.url + '/' + settings.db.events + '?' + params.eventsRepeat.join('&'),
        };

        // console.log('URLs: ', urls);

        Promise.all([
            fetch(urls.booking),
            fetch(urls.eventsCurrent),
            fetch(urls.eventsRepeat),
        ])
            .then(function(allResponses){
                const bookingsResponse = allResponses[0];
                const eventsCurrentResponse = allResponses[1];
                const eventsRepeatResponse = allResponses[2];
                return Promise.all([
                    bookingsResponse.json(),
                    eventsCurrentResponse.json(),
                    eventsRepeatResponse.json(),
                ]); 
        })
            .then(function([bookings, eventsCurrent, eventsRepeat]){
                // console.log(bookings);
                // console.log(eventsCurrent);
                // console.log(eventsRepeat);
                thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
        });
    }

    parseData(bookings, eventsCurrent, eventsRepeat){
        const thisBooking = this;

        thisBooking.booked = {};

        for(let item of bookings){
            thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
        }

        for(let item of eventsCurrent){
            thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
        }

        const minDate = thisBooking.datePicker.minDate;
        const maxDate = thisBooking.datePicker.maxDate;

        for(let item of eventsRepeat){
            if(item.repeat == 'daily'){
                for(let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)){
                    
                    thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
                }
            }
        }
        // console.log('thisBooking.booked: ', thisBooking.booked);
        thisBooking.updateDOM();
    }

    makeBooked(date, hour, duration, table){
        const thisBooking = this;

        if(typeof thisBooking.booked[date] == 'undefined'){
            thisBooking.booked[date] = {};
        }

        const startHour = utils.hourToNumber(hour);



        for(let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5){
            // console.log('loop', hourBlock);

            if(typeof thisBooking.booked[date][hourBlock] == 'undefined'){
                thisBooking.booked[date][hourBlock] = [];
            }
    
            thisBooking.booked[date][hourBlock].push(table);
        }
        }

    pickTable(){
        const thisBooking = this;

        thisBooking.dom.floorPlan.addEventListener('click', function(event){
            if(event.target.classList.contains(classNames.booking.table)){
                if(!event.target.classList.contains(classNames.booking.tableBooked)){

                    const alreadyPickedTable = thisBooking.dom.wrapper.querySelector('.table.picked');

                    if(alreadyPickedTable){
                        alreadyPickedTable.classList.remove(classNames.booking.tablePicked);
                    } 

                    const pickedTableId = event.target.getAttribute('data-table');
                    thisBooking.pickedTable = pickedTableId;
                    

                    event.target.classList.add(classNames.booking.tablePicked);

                    if(event.target == alreadyPickedTable){
                        event.target.classList.remove('picked');
                        thisBooking.pickedTable = null;
                    }

                } else {
                    alert('Niestety, ten stolik jest już zajęty');
                } 
            } 
            
        })
    }  
    
    resetSelection(){
        const thisBooking = this;

        const alreadyPickedTable = thisBooking.dom.wrapper.querySelector('.table.picked');
        if(alreadyPickedTable){
            alreadyPickedTable.classList.remove(classNames.booking.tablePicked);
        }

        thisBooking.pickedTable = null;
    }

    updateDOM(){
        const thisBooking = this;

        thisBooking.resetSelection();

        thisBooking.date = thisBooking.datePicker.value;
        thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

        let allAvailable = false;

        if(
            typeof thisBooking.booked[thisBooking.date] == 'undefined'
            ||
            typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
        ) {
            allAvailable = true;
        }

        for (let table of thisBooking.dom.tables){
            let tableId = table.getAttribute(settings.booking.tableIdAttribute);
            if(!isNaN(tableId)){
                tableId = parseInt(tableId); 
            }

            if(
                !allAvailable
                &&
                thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
            ){
                table.classList.add(classNames.booking.tableBooked);
            } else {
                table.classList.remove(classNames.booking.tableBooked);
            }
        }
    }    

    render(element){
        const thisBooking = this;

        const generatedHTML = templates.bookingWidget();

        thisBooking.dom = {};

        thisBooking.dom.wrapper = element;
        thisBooking.dom.wrapper.innerHTML = generatedHTML;

        thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
        thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);

        thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
        thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);

        thisBooking.dom.floorPlan = thisBooking.dom.wrapper.querySelector(select.booking.floorPlan);
        thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);

        thisBooking.dom.bookingForm = thisBooking.dom.wrapper.querySelector(select.booking.bookingForm);

        thisBooking.dom.starters = thisBooking.dom.wrapper.querySelectorAll(select.booking.checkBox)

        thisBooking.dom.phoneNumber = thisBooking.dom.wrapper.querySelector(select.booking.phoneNumber);
        thisBooking.dom.address = thisBooking.dom.wrapper.querySelector(select.booking.address);
       
                
    }

    initWidgets(){
        const thisBooking = this;

        thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
        thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);

        thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
        thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);

        thisBooking.dom.wrapper.addEventListener('updated', function(){
            thisBooking.updateDOM();
        })

        thisBooking.dom.bookingForm.addEventListener('submit', function(event){
            event.preventDefault();
            thisBooking.sendBooking();
        })
        
        
        // thisBooking.peopleAmount.addEventListener('updated', function(){

        // });

        // thisBooking.hoursAmount.addEventListener('updated', function(){

        // });
    }

    sendBooking(){
        const thisBooking = this;

        const url = settings.db.url + '/' + settings.db.bookings;

        

        if (!isNaN(thisBooking.pickedTable)){
            thisBooking.pickedTableNumber = parseInt(thisBooking.pickedTable)
        } else {
            thisBooking.pickedTableNumber = null;
        }

        thisBooking.pickedTableNumber = thisBooking.pickedTable;

        

        const payload = {
            date: thisBooking.datePicker.value,
            hour: thisBooking.hourPicker.value,
            table: thisBooking.pickedTableNumber,
            duration: parseInt(thisBooking.hoursAmount.value),
            ppl: thisBooking.peopleAmount.value,
            starters: [],
            phone: thisBooking.dom.phoneNumber.value,
            address: thisBooking.dom.address.value,
        };

        console.log('payload Booking: ', payload);

        for(let starter of thisBooking.dom.starters){
            if(starter.checked){
                payload.starters.push(starter.value);
            }
        }

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

export default Booking;