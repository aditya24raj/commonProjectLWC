import { LightningElement, wire } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import { deleteRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import fetchAllRecords from '@salesforce/apex/CancelledBookingController.fetchAllRecords';
import fetchThisRecord from '@salesforce/apex/CancelledBookingController.fetchThisRecord';
import fetchAllAirports from '@salesforce/apex/airportControllerRaj.fetchAllRecords';
import fetchFlights from '@salesforce/apex/CancelledBookingController.fetchFlights';
import fetchFares from '@salesforce/apex/CancelledBookingController.fetchFares';
import upsertRecord from '@salesforce/apex/CancelledBookingController.upsertRecord'
import cancelRecord from '@salesforce/apex/CancelledBookingController.cancelRecord';

export default class CancelledBookingComponentRaj extends LightningElement {
    // Boolean to store whether any record was clicked in vertical navigation menu
    isView;
    // Boolean to store whether edit button was clicked or not
    isEdit;

    // Record which was selected in vertical navigation menu
    selectedRecordName;
    selectedRecordId;

    // Storing previously selected record Used to navigate back to previous selection(
    // when 'Add' button is clicked but user presses cancel in the form)
    selectedRecordNamePrevious;
    selectedRecordIdPrevious;
    
    // Get All the records to display them in vertical navigation menu
    @wire(fetchAllRecords)
    recordList;

    // Get details of selected record
    recordDetails;
    // Storing data & error in this var for refresh apex
    // recordDetails can be used for this purpose but then in html to refer Name field will require typing recordDetails.data.Name
    // currently we only require recordDetails.Name, if we only store data in recordDetails, refreshApex will not work(refer to https://salesforce.stackexchange.com/questions/336819/refresh-apex-in-lwc-not-working)
    _wiredRecordDetails; 
    @wire(fetchThisRecord, {recordId: '$selectedRecordId'})
    PopulateRecordDetails(wireResult) {
        const {data, error } = wireResult;
        this._wiredRecordDetails = wireResult;

        if (data) {
            this.recordDetails = data[0];
            this.selectedRecordName = this.recordDetails.Name;
            console.log("data recieved: ", this.recordDetails);

            // when ever new data is fetched; revert to view mode. some layout change will occur and user will know his actions had some impact
            this.isView = true;
            this.isEdit = false;
        }
        else {
            console.log("error: ",error);
        }
    }

    // details of selected record;
    recordDetails;
    handleSelect(event) {
        console.log("handleselect: ", event.detail.name);
        // User has selected an option in vertical navigation menu, store its name attribute
        this.selectedRecordId = event.detail.name;
        // fetch record details of this new recordId
        refreshApex(this._wiredRecordDetails);
    }

    // editable variable for selected record fields
    // onboarding from
    editableOnboardingFrom;
    selectedOnboardingFrom;

    // onboarding from on change handler
    editableOnboardingFromOnChange(event) {
        this.selectedOnboardingFrom = event.target.value;
        console.log("edited onboarding from: ",this.selectedOnboardingFrom);
        // call to populate editableArrivingTo,
        // so that arriving options are updated based on onboarding from
        this.populateEditableArrivingTo();
        this.populateEditableFlight();
    }

    // fill onboarding from combo-box 
    populateEditableOnboardingFrom() {
        fetchAllAirports()
            .then(result => {
                // prepare editableOnboardingFrom for combo-box options
                this.editableOnboardingFrom = [];
                for (var i=0; i<result.length; i++) {
                    this.editableOnboardingFrom = [
                        ...this.editableOnboardingFrom,
                        {label:result[i].Name, value:result[i].Id}
                    ];
                }
            })
            .catch(error => console.log(error));
    }

    // Arriving To
    editableArrivingTo;
    selectedArrivingTo;

    // arriving to on change handler
    editableArrivingToOnChange(event) {
        this.selectedArrivingTo = event.target.value;
        console.log("edited arriving to: ",this.selectedArrivingTo);
        this.populateEditableFlight();

    }

    // fill arriving to combo-box 
    populateEditableArrivingTo() {
        fetchAllAirports()
            .then(result => {
                // prepare editableArrivingTo for combo-box options
                this.editableArrivingTo = [];
                for (var i=0; i<result.length; i++) {
                    if (this.selectedOnboardingFrom != result[i].Id) {
                        // include all but onboarding airport, as onboarding and arriving airports cannot be same
                        this.editableArrivingTo = [
                            ...this.editableArrivingTo,
                            {label:result[i].Name, value:result[i].Id}
                        ];
                    }
                }
            })
            .catch(error => console.log(error));
    }

    // flight
    editableFlight;
    selectedFlight;

    // flight on change handler
    editableFlightOnChange(event) {
        this.selectedFlight = event.target.value;
        console.log("edited flight: ",this.selectedFlight);
        this.populateEditableFare();
    }

    // fill Flight combo-box 
    populateEditableFlight() {
        fetchFlights({
            onboardingFromAirport: this.selectedOnboardingFrom,
            arrivingToAirport: this.selectedArrivingTo
        })
            .then(result => {
                console.log(result);
                // prepare editableArrivingTo for combo-box options
                this.editableFlight = [];
                for (var i=0; i<result.length; i++) {
                    this.editableFlight = [
                        ...this.editableFlight,
                        {label:result[i].Name, value:result[i].Id}
                    ];
                    
                }
            })
            .catch(error => console.log(error));
    }

    // Passenger Name
    editablePassengerName;
    editablePassengerNameOnChange(event) {
        this.editablePassengerName = event.target.value;
        console.log("edited PassengerName: ", this.editablePassengerName);
    }

    // Passenger Email
    editablePassengerEmail;
    editablePassengerEmailOnChange(event) {
        this.editablePassengerEmail = event.target.value;
        console.log("edited PassengerEmail: ", this.editablePassengerEmail);
    }

    // Passenger Type
    editablePassengerType=[
        {label:"Infant", value:"Infant"},
        {label:"Children", value:"Children"},
        {label:"Adult", value:"Adult"},
        {label:"Senior Citizen", value:"Senior Citizen"},
    ];
    selectedPassengerType;

    // Passenger on change handler
    editablePassengerTypeOnChange(event) {
        this.selectedPassengerType = event.target.value;
        console.log("edited passenger type: ", this.selectedPassengerType);
        this.populateEditableFare();
    }

    // Fare Type
    editableFareType;
    selectedFareType;


    // Fare on change handler
    editableFareTypeOnChange(event) {
        this.selectedFareType = event.target.value;
        console.log("edited Fare type: ", this.selectedFareType);
    }

    // fill Fare combo-box 
    populateEditableFare() {
        fetchFares({
            flightId : this.selectedFlight,
            passengerType : this.selectedPassengerType
        })
            .then(result => {
                console.log(result);
                // prepare editableArrivingTo for combo-box options
                this.editableFareType = [];
                for (var i=0; i<result.length; i++) {
                    this.editableFareType = [
                        ...this.editableFareType,
                        {
                            label:result[i].Name + ", ₹ " + result[i].Price__c,
                            value:result[i].Id
                        }
                    ];
                    
                }
            })
            .catch(error => console.log(error));
    }

    // Food Type
    editableFoodType=[
        {label:"Veg", value:"Veg"},
        {label:"Non-Veg", value:"Non-Veg"}
    ];
    selectedFoodType;

    // Food on change handler
    editableFoodTypeOnChange(event) {
        this.selectedFoodType = event.target.value;
        console.log("edited Food type: ", this.selectedFoodType);
    }

    // Preferred Payment Method
    editablePaymentType=[
        {label:"Google Pay", value:"Google Pay"},
        {label:"Phone Pe", value:"Phone Pe"},
        {label:"Credit Card", value:"Credit Card"},
        {label:"Debit Card", value:"Debit Card"}

    ];
    selectedPaymentType;

    // Payment on change handler
    editablePaymentTypeOnChange(event) {
        this.selectedPaymentType = event.target.value;
        console.log("edited Payment type: ", this.selectedPaymentType);
    }

    // readonly fields for selected record
    readableBookingStatus;
    readableBookingNumber;
    readableTotalFare;

    handleEdit() {
        // initialize vars to store editable record details(give current values as default)
        // set booking status of this booking as default
        this.selectedBookingStatus = this.recordDetails.Booking_status__c;

        // Populate onboarding from
        this.populateEditableOnboardingFrom();
        // set default to onboarding from of this booking
        this.selectedOnboardingFrom = this.recordDetails.Onboarding_From__c;

        
        // arrivingTo
        // set editableArrivingTo
        this.populateEditableArrivingTo();
        // set selectedArrivingTo to arrivingTo of this booking
        this.selectedArrivingTo = this.recordDetails.Arriving_To__c;

        // flight
        // populate flight field
        this.populateEditableFlight();
        // set this bookings flight as default
        this.selectedFlight = this.recordDetails.Flight_Name__c;
        
        //Passenger Name
        this.editablePassengerName = this.recordDetails.Passenger_Name__c;

        // Passenger Email
        this.editablePassengerEmail = this.recordDetails.Passenger_Email__c;
        
        // Passenger Type
        this.selectedPassengerType = this.recordDetails.Passenger_Type__c;
        
        // Populate fare type
        this.populateEditableFare();
        // set this booking's Fare Type as default
        this.selectedFareType = this.recordDetails.Fare_Type__c;

        // Food Type
        this.selectedFoodType = this.recordDetails.Food_Type__c;

        // Payment mode
        this.selectedPaymentType = this.recordDetails.Payment_Mode__c;

        // Read Only Fields
        this.readableBookingNumber = this.recordDetails.Name;
        this.readableTotalFare = this.recordDetails.Fare_Type__r.Price__c;
        this.readableBookingStatus = this.recordDetails.Booking_status__c;

        // setting state variables, such that conditional rendering displays edit details
        this.isView = false;
        this.isEdit = true;
    }

    handleAdd() {
        // handleAdd is same as handleEdit, we just initialize editable record details with blank values        // set booking status of this booking as default
        this.selectedBookingStatus = "Confirmed";

        // Populate onboarding from
        this.populateEditableOnboardingFrom();
        // set default to null
        this.selectedOnboardingFrom = null;
        
        // arrivingTo
        // set editableArrivingTo
        this.populateEditableArrivingTo();
        // set selectedArrivingTo to null;
        this.selectedArrivingTo = null;

        // flight
        // populate flight field
        this.populateEditableFlight();
        // set this bookings flight as null
        this.selectedFlight = null;
        
        //Passenger Name, null to keep it blank
        this.editablePassengerName = null;

        // Passenger Email
        this.editablePassengerEmail = null;
        
        // Passenger Type
        this.selectedPassengerType = null;
        
        // Fare Type
        this.selectedFareType = null;

        // Food Type
        this.selectedFoodType = null;

        // Payment mode
        this.selectedPaymentType = null;
        
        // Read Only Fields
        this.readableBookingStatus = "Auto-Generated";
        this.readableBookingNumber = "Auto-Generated";
        this.readableTotalFare = "Auto-Generated";

        // Store current id and record in a seperate variable(
        //      so that we can revert to whatever we were showing before this add event; better implementation would be to show newly created record
        //      but couldnot figure out how make a value currently active in vertical navigation menu(TODO))
        // and make current id and record null(just explicitly setting state of UI)
        this.selectedRecordIdPrevious = this.selectedRecordId;
        this.selectedRecordId = null;

        this.selectedRecordNamePrevious = this.selectedRecordName;
        this.selectedRecordName = null;

        // setting state variables, such that conditional rendering displays edit details
        this.isView = false;
        this.isEdit = true;
    }

    handleEditCancel() {
        // handleEditCancel also handles cancel button press on new record page
        // handleAdd makes these vars null, if cancelled revert them to original value
        if (this.selectedRecordIdPrevious) {
            this.selectedRecordId = this.selectedRecordIdPrevious;
            this.selectedRecordName = this.selectedRecordNamePrevious;

            // setting state variable, such that conditional rendering displays selectedRecordId
            this.isView = true;
            this.isEdit = false;
        }
        else if (this.selectedRecordId) {
            // there is selectedRecordId to display; display no data illustration
            this.isView = true;
            this.isEdit = false;
        }
        else {
            // there no selectedRecordId to display; display no data illustration
            this.isView = false;
            this.isEdit = false;

        }
    }

    // handle save
    handleEditSave() {
        console.log("inside edit save");
        console.log("Booking Id: ", this.selectedRecordId);
        console.log("Booking status: ", this.selectedBookingStatus);
        console.log("Onboarding From: ", this.selectedOnboardingFrom);
        console.log("arriving to: ", this.selectedArrivingTo);
        console.log("flight Id: ", this.selectedFlight);
        console.log("passenger name: ", this.editablePassengerName);
        console.log("passenger email: ", this.editablePassengerEmail);
        console.log("passenger type: ", this.selectedPassengerType);
        console.log("food type: ", this.selectedFoodType);
        console.log("payment mode: ", this.selectedPaymentType);
        console.log("fare type: ", this.selectedFareType);
        
        
        upsertRecord({
            bookingId: this.selectedRecordId,
            bookingStatus: this.selectedBookingStatus,
            onboardingFromAirport: this.selectedOnboardingFrom,
            arrivingToAirport: this.selectedArrivingTo,
            flightId: this.selectedFlight,
            passengerName: this.editablePassengerName,
            passengerEmail: this.editablePassengerEmail,
            passengerType: this.selectedPassengerType,
            foodType: this.selectedFoodType,
            paymentType: this.selectedPaymentType,
            fareId: this.selectedFareType
            
        })
            .then(result => {
                console.log("got saved")
                // refresh items in navbar
                refreshApex(this.recordList);
                refreshApex(this._wiredRecordDetails);

                // revert to what ever record we were showing before
                this.handleEditCancel();

                // Show a success toast 
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: ``,
                        variant: 'success'
                    })
                );
            })
            .catch(error => {
                console.log(error);
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: error.body.message,
                        variant: 'error',
                        mode: 'sticky'
                    })
                );
            });
    }

    handleCancelBooking() {
        console.log("inside edit save");
        console.log("Booking Id: ", this.selectedRecordId);
        
        
        cancelRecord({
            bookingId: this.selectedRecordId
        })
            .then(result => {
                console.log("got saved")
                // refresh items in navbar
                refreshApex(this.recordList);
                refreshApex(this._wiredRecordDetails);

                // revert to what ever record we were showing before
                this.handleEditCancel();

                // Show a success toast 
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: ``,
                        variant: 'success'
                    })
                );
            })
            .catch(error => {
                console.log(error);
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: error.body.message,
                        variant: 'error',
                        mode: 'sticky'
                    })
                );
            });

    }

    handlePrint() {
        console.log("inside print");
        window.open(`https://mirketa-12c-dev-ed.my.salesforce.com/${this.selectedRecordId}/p`, '_blank').focus();
    }
    
    handleDelete() {
        //User clicked on delete button
        //User this standard function to delete records
        deleteRecord(this.selectedRecordId)
            .then(() => {
                // Show a success toast 
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: `${this.selectedRecordName} deleted`,
                        variant: 'success'
                    })
                );
                // Fetch records again to remove this deleted records from being displayed
                refreshApex(this.recordList);
                refreshApex(this._wiredRecordDetails);


                // explicitly change these state variables to show nothing until user selects a record
                this.selectedRecordName = null;
                this.selectedRecordId = null;
                
                // set state variable
                this.isView = false;
                this.isEdit = false;

            })
            .catch(error => {
                // In case of error display an error toast
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: `Error deleting ${this.selectedRecordName}`,
                        message: error.body.message,
                        variant: 'error'
                    })
                );
            });
    }
}