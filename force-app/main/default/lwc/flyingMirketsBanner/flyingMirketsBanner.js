import { LightningElement } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class FlyingMirketsBanner extends NavigationMixin(LightningElement) {
    navigateBookingCreate() {
        this[NavigationMixin.Navigate]({
            type: 'standard__navItemPage',
            attributes: {
                apiName: 'Booking_LWC',
            }
        });
    }
}