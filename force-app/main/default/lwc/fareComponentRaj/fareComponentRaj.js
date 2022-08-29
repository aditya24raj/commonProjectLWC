import { LightningElement, wire } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import { deleteRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import fetchAllRecords from '@salesforce/apex/FareControllerRaj.fetchAllRecords';
import fetchThisRecord from '@salesforce/apex/FareControllerRaj.fetchThisRecord';
import fetchAllFlights from '@salesforce/apex/FlightControllerRaj.fetchAllRecords';
import upsertRecord from '@salesforce/apex/FareControllerRaj.upsertRecord';


export default class FareComponentRaj extends LightningElement {
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

    // populate recordList such that it's has one field named as flightNumber/fareType/passengerType
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
            this.selectedRecordName = this.recordDetails.Flight__r.Name + "/" + this.recordDetails.Name + "/" + this.recordDetails.Passenger_Type__c;
            console.log(this.recordDetails);
            // console.log("flight number: ", this.recordDetails.Name);
            // console.log("flight status: ", this.recordDetails.Flight_Status__c);
            // console.log("onboarding from: ", this.recordDetails.Onboarding_From__r.Name);
            // console.log("arriving to: ", this.recordDetails.Arriving_To__r.Name);
            // console.log("arrival time: ", this.recordDetails.Arrival_Time__c);
            // console.log("depart time: ", this.recordDetails.Depart_Time__c);
            // console.log("duration: ", this.recordDetails.Duration__c);

            // when ever new data is fetched; revert to view mode. some layout change will occur and user will know his actions had some impact
            this.isView = true;
            this.isEdit = false;
        }
        else {
            console.log("error: ",error);
        }
    }

    handleSelect(event) {
        // User has selected an option in vertical navigation menu, store its name attribute
        this.selectedRecordId = event.detail.name;
        // fetch record details of this new recordId
        refreshApex(this._wiredRecordDetails);
    }

    // editable variable for selected record fields
    // flight of this fare
    editableFlight;
    selectedFlight;

    // flight on change handler
    editableFlightOnChange(event) {
        this.selectedFlight = event.target.value;
        console.log("edited Flight: ",this.selectedFlight);
    }

    // fill Flight combo-box 
    populateEditableFlight() {
        fetchAllFlights()
            .then(result => {
                // prepare editableFlight for combo-box options
                this.editableFlight = [];
                for (var i=0; i<result.length; i++) {
                    this.editableFlight = [
                        ...this.editableFlight,
                        {label:result[i].Name, value:result[i].Id}
                    ];
                }
            })
            .catch(error => console.log("error fetching flights: ", error));
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
    }

    // Fare Type
    editableFareType=[
        {label:"Saver", value:"Saver"},
        {label:"Flexi Plus", value:"Flexi Plus"}
    ];
    selectedFareType;

    // Fare on change handler
    editableFareTypeOnChange(event) {
        this.selectedFareType = event.target.value;
        console.log("edited Fare type: ", this.selectedFareType);
    }

    // Price
    editablePrice;

    // Price on change handler
    editablePriceOnChange(event) {
        this.editablePrice = event.target.value;
        console.log("editable price: ", this.editablePrice);
    }

    handleEdit() {
        // initialize editable vars to store record details(give current values as default)
        // Populate flight comobo-box
        this.populateEditableFlight();
        // flightId of current record
        this.selectedFlight = this.recordDetails.Flight__c;

        // passenger type of current record
        this.selectedPassengerType = this.recordDetails.Passenger_Type__c;

        // Fare type of current record
        this.selectedFareType = this.recordDetails.Name;

        // Price of current record
        this.editablePrice = this.recordDetails.Price__c;

        // setting state variables, such that conditional rendering displays edit details
        this.isView = false;
        this.isEdit = true;
    }

    handleAdd() {
        // handleAdd is same as handleEdit, we just initialize editable record details with blank values
        // Populate flight comobo-box
        this.populateEditableFlight();
        // null so that user gets field with no values
        this.selectedFlight = null;

        // null so that user gets field with no values
        this.selectedPassengerType = null;

        // null so that user gets field with no values
        this.selectedFareType = null;

        // null so that user gets field with no values
        this.editablePrice = null;

        // Store current id and record in a seperate variable(
        //      so that we can revert to whatever we were showing before this add event; better implementation would be to show newly created record
        //      but couldnot figure out how make a value currently active in vertical navigation menu(TODO))
        // and make current id and record null(just explicitly setting state of UI)
        this.selectedRecordIdPrevious = this.selectedRecordId;
        this.selectedRecordId = null;

        this.selectedRecordNamePrevious = this.selectedRecordName;
        this.selectedRecordName = null;

        // setting state variables, such that conditional rendering displays edit details(fields will be blank this time)
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
        else {
            // there is no selectedRecordId to display; display no data illustration
            this.isView = false;
            this.isEdit = false;
        }
    }

    handleEditSave() {
        console.log("inside edit save");
        console.log("this.selectedRecordId: ", this.selectedRecordId);
        console.log("this.selectedFareType: ", this.selectedFareType);
        console.log("this.selectedFlight: ", this.selectedFlight);
        console.log("this.selectedPassengerType: ", this.selectedPassengerType);
        console.log("this.editablePrice: ", this.editablePrice);
        
        upsertRecord({
            fareId : this.selectedRecordId,
            fareType : this.selectedFareType,
            flightId : this.selectedFlight,
            passengerType : this.selectedPassengerType,
            price : parseFloat(this.editablePrice)
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