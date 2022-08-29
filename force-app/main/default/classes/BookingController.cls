public with sharing class BookingController {
    
    @AuraEnabled(cacheable=true)
    public static List<Booking__c> fetchAllRecords(){
        try {
            return [SELECT Name FROM Booking__c];
            
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<Booking__c> fetchThisRecord(){
        try {
            return [SELECT Name, Booking_status__c, Onboarding_From__r.Name, Arriving_To__r.Name, Flight_Name__r.Name, Flight_Name__r.Duration__c, Passenger_Name__c, Passenger_Email__c, Food_Type__c, Payment_Mode__c, Passenger_Type__c, Fare_Type__r.Name, Fare_Type__r.Price__c FROM Booking__c];
            
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }


}
