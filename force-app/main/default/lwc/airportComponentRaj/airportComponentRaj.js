import { LightningElement, wire } from 'lwc';
import fetchAllAirports from '@salesforce/apex/airportControllerRaj.fetchAllAirports';
import fetchAirportName from '@salesforce/apex/airportControllerRaj.fetchAirportName';
import { refreshApex } from '@salesforce/apex';
import { deleteRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';


export default class AirportComponentRaj extends LightningElement
{
    // Record which was selected in vertical navigation menu
    // these variables(starting with 'selected' determine state of our UI,
    // like which record/form/buttons/components to display)
    selectedRecordName;
    selectedRecordId;
    
    // Boolean to store whether add button was clicked or not
    selectedAddRecord;

    // Storing previously selected record Used to navigate back to previous selection(
    // when 'Add' button is clicked but user presses cancel in the form)
    selectedRecordNamePrevious;
    selectedRecordIdPrevious;
    
    // Get All the records to display them in vertical navigation menu
    @wire(fetchAllAirports)
    recordList;

    handleSelect(event) {
        // User has selected an option in vertical navigation menu, store its name attribute
        this.selectedRecordId = event.detail.name;

        // Name of this record should be in event but couldn't figure out how to fetch it
        // Using an apex function to fetch record name based on record id
        fetchAirportName({ airportId : this.selectedRecordId })
            .then(result => this.selectedRecordName = result)
            .catch(error => console.log("airport name error: ", error));
        
        // selectedRecordId and selectedRecordName are already set, just setting selectedAddRecord explicitly to be false
        // so that we are totally sure of in which state our UI is 
        this.selectedAddRecord = false;
    }

    handleAdd() {
        // User clicked on Add button

        // Store current id and record in a seperate variable
        // and make current id and record null(just explicitly setting state of UI)
        this.selectedRecordIdPrevious = this.selectedRecordId;
        this.selectedRecordId = null;

        this.selectedRecordNamePrevious = this.selectedRecordName;
        this.selectedRecordName = null;

        // Conditional rendering will only find this value to be true(all other state variables set to null)
        // and will a new record form
        this.selectedAddRecord = true;
    }

    handleAddCancel() {
        // User clicked on cancel button on record form
        // Change these variable to previous values, so that we display what we were before user clicked add button
        this.selectedRecordId = this.selectedRecordIdPrevious;
        this.selectedRecordName = this.selectedRecordNamePrevious;

        // Setting it to false, to indicate we don't want new record form to be visible
        this.selectedAddRecord = false;
    }

    handleAddSuccess(event) {
        // User clicked on save button/pressed enter
        // Fetch records again to get this newly added record
        refreshApex(this.recordList);
        
        // Show a success toast
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: `Record Added`,
                variant: 'success'
            })
        );
        
        // Change these variable to previous values, so that we display what we were before user clicked add button
        // Better option would be to show newly created record,
        // but could not figure out how to change selected option in vertical navigation menu
        this.selectedRecordId = this.selectedRecordIdPrevious;
        this.selectedRecordName = this.selectedRecordNamePrevious;

        // conditional rendering will evaluate this and will not show add record form
        this.selectedAddRecord = false;
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

                // explicitly change these state variables to show nothing until user selects a record
                this.selectedRecordName = null;
                this.selectedRecordId = null;
                this.selectedAddRecord = false;

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