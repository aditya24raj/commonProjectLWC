import { LightningElement, wire } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import { deleteRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import fetchAllRecords from '@salesforce/apex/BookingController.fetchAllRecords';
import fetchThisRecord from '@salesforce/apex/BookingController.fetchThisRecord';


export default class BookingComponentRaj extends LightningElement {
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

    // details of selected record;
    recordDetails;
    handleSelect(event) {
        // User has selected an option in vertical navigation menu, store its name attribute
        this.selectedRecordId = event.detail.name;
        // fetch record details of this new recordId
        refreshApex(this._wiredRecordDetails);
    }


}