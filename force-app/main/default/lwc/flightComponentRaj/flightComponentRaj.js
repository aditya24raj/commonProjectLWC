import { LightningElement, wire } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import { deleteRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import fetchAllRecords from '@salesforce/apex/FlightControllerRaj.fetchAllRecords';
import fetchThisRecord from '@salesforce/apex/FlightControllerRaj.fetchThisRecord';
import fetchAllAirports from '@salesforce/apex/airportControllerRaj.fetchAllRecords';
import upsertRecord from '@salesforce/apex/FlightControllerRaj.upsertRecord';



export default class FlightComponentRaj extends LightningElement {
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

    // fields of selected record and their on change handler
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

    // details of selected record;
    recordDetails;
    handleSelect(event) {
        // User has selected an option in vertical navigation menu, store its name attribute
        this.selectedRecordId = event.detail.name;
        // fetch record details of this new recordId
        refreshApex(this._wiredRecordDetails);
    }

    // Onboarding time
    editableOnboardingTime;
    editableOnboardingTimeOnChange(event) {
        this.editableOnboardingTime = event.target.value;
        console.log("edited onboarding time: ", this.editableOnboardingTime);
    }

    // Arriving time
    editableArrivingTime;
    editableArrivingTimeOnChange(event) {
        this.editableArrivingTime = event.target.value;
        console.log("edited Arriving time: ", this.editableArrivingTime);
    }

    // Status
    editableStatus = [
        {label:"Approved", value:"Approved"},
        {label:"Rejected", value:"Rejected"},
        {label:"Pending", value:"Pending"},
        {label:"Recall", value:"Recall"}

    ];
    selectedStatus;
    editableStatusOnChange(event) {
        this.selectedStatus = event.target.value;
        console.log("edited flight status: ", this.selectedStatus);
    }

    // Read Only Fields
    readableFlightNumber;
    readableDuration;

    handleEdit() {
        // initialize vars to store editable record details(give current values as default)
        
        // onboardingFrom
        // set editableOnboardingFrom
        this.populateEditableOnboardingFrom();
        // set selectedOnboardingFrom to onboardingFrom of this flight
        this.selectedOnboardingFrom = this.recordDetails.Onboarding_From__c;

        // arrivingTo
        // set editableArrivingTo
        this.populateEditableArrivingTo();
        // set selectedArrivingTo to arrivingTo of this flight
        this.selectedArrivingTo = this.recordDetails.Arriving_To__c;

        // onboarding time
        // get onboarding time of this flight
        var tmpOnboardingTime = new Date(this.recordDetails.Depart_Time__c);
        // get(getting it this way is dirty) time in ISO8601 format(supported by lightining-input type time)
        this.editableOnboardingTime = tmpOnboardingTime.toISOString().split('T')[1];

        // Arriving time
        // get Arriving time of this flight
        var tmpArrivingTime = new Date(this.recordDetails.Arrival_Time__c);
        // get(getting it this way is dirty) time in ISO8601 format(supported by lightining-input type time)
        this.editableArrivingTime = tmpArrivingTime.toISOString().split('T')[1];

        // status
        this.selectedStatus = this.recordDetails.Flight_Status__c;

        // Read Only Fields
        this.readableFlightNumber = this.recordDetails.Name;
        this.readableDuration = this.recordDetails.Duration__c;

        // setting state variables, such that conditional rendering displays edit details
        this.isView = false;
        this.isEdit = true;
    }

    handleAdd() {
        console.log("inside add");
        // handleAdd is same as handleEdit, we just initialize editable record details with blank values
        // onboardingFrom
        // set editableOnboardingFrom
        this.populateEditableOnboardingFrom();
        // set selectedOnboardingFrom to null, so that it is blank
        this.selectedOnboardingFrom = null;

        // arrivingTo
        // set editableArrivingTo
        this.populateEditableArrivingTo();
        // set selectedArrivingTo to null, so that it is blank
        this.selectedArrivingTo = null;

        // onboarding time
        // null, so that it is blank
        this.editableOnboardingTime = null;

        // Arriving time
        // null, so that it is blanks
        this.editableArrivingTime = null;

        // status
        this.selectedStatus = null;

        // Read Only Fields
        this.readableFlightNumber = "Auto-Generated";
        this.readableDuration = "Auto-Generated";


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
        var [
            onboardingHour,
            onboardingMinute,
            onboardingSecond
        ] = this.editableOnboardingTime.split(":");

        onboardingHour = parseInt(onboardingHour);
        onboardingMinute = parseInt(onboardingMinute);

        console.log("onboarding hour: ", onboardingHour);
        console.log("onboarding minute: ", onboardingMinute);

        var [
            arrivingHour,
            arrivingMinute,
            arrivingSecond
        ] = this.editableArrivingTime.split(":");

        arrivingHour = parseInt(arrivingHour);
        arrivingMinute = parseInt(arrivingMinute);

        console.log("arriving hour: ", arrivingHour);
        console.log("arriving minute: ", arrivingMinute);


        upsertRecord({
            flightId : this.selectedRecordId,
            flightStatus : this.selectedStatus,
            onboardingFrom : this.selectedOnboardingFrom,
            arrivingTo : this.selectedArrivingTo,
            onboardingTimeHH : onboardingHour,
            onboardingTimeMM : onboardingMinute,
            arrivalTimeHH : arrivingHour,
            arrivalTimeMM : arrivingMinute
        })
            .then(result => {
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