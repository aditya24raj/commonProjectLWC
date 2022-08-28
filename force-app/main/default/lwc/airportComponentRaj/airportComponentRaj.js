import { LightningElement, wire } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import { deleteRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import fetchAllRecords from '@salesforce/apex/airportControllerRaj.fetchAllRecords';
import upsertRecord from '@salesforce/apex/airportControllerRaj.upsertRecord';
import fetchThisRecord from '@salesforce/apex/airportControllerRaj.fetchThisRecord';


export default class AirportComponentRaj extends LightningElement
{
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

            // when ever new data is fetched; revert to view mode. some layout change will occur and user will know his actions had some impact
            this.isView = true;
            this.isEdit = false;
        }
        else {
            console.log("error: ",error);
        }
    }

    // fields of selected record and their on change handler
    editableNameField;
    editableNameFieldOnChange(event) {
        this.editableNameField = event.target.value;
    }

    // details of selected record;
    recordDetails;
    handleSelect(event) {
        // User has selected an option in vertical navigation menu, store its name attribute
        this.selectedRecordId = event.detail.name;
        // fetch record details of this new recordId
        refreshApex(this._wiredRecordDetails);
    }

    handleEdit() {
        // initialize this vars to store editable record details(give current values as default)
        this.editableNameField = this.recordDetails.Name;

        // setting state variables, such that conditional rendering displays edit details
        this.isView = false;
        this.isEdit = true;
    }

    handleAdd() {
        // handleAdd is same as handleEdit, we just initialize editable record details with blank values
        this.editableNameField = "";

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
        upsertRecord({recordId : this.selectedRecordId, airportCity: this.editableNameField})
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
                        message: `${this.editableNameField}`,
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