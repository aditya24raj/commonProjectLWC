public with sharing class CancelledBookingController {
    @AuraEnabled(cacheable=true)
    public static List<Booking__c> fetchAllRecords(){
        try {
            return [SELECT Name FROM Booking__c WHERE Booking_status__c='Cancelled' ORDER BY Name];
            
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<Booking__c> fetchThisRecord(String recordId){
        try {
            return [SELECT Name, Booking_status__c, Onboarding_From__r.Name, Arriving_To__r.Name, Flight_Name__r.Name, Flight_Name__r.Duration__c, Passenger_Name__c, Passenger_Email__c, Food_Type__c, Payment_Mode__c, Passenger_Type__c, Fare_Type__r.Name, Fare_Type__r.Price__c FROM Booking__c WHERE Id=:recordId];
            
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<Flight__c> fetchFlights(String onboardingFromAirport, String arrivingToAirport){
        try {
            //new Flight__c().Duration__c
            return [SELECT Name, Depart_Time__c, Arrival_Time__c, Duration__c  FROM Flight__c WHERE Onboarding_From__c=:onboardingFromAirport AND Arriving_To__c=:arrivingToAirport AND Flight_Status__c='Approved' ORDER BY NAME];
            
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<Fare__c> fetchFares(String flightId, String passengerType){
        try {
            //new Fare__c().Passenger_Type__c
            return [SELECT Name, Price__c FROM Fare__c WHERE Flight__c = :flightId AND Passenger_Type__c = :passengerType];
            
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }



    @AuraEnabled
    public static void upsertRecord(
        String bookingId,
        String bookingStatus,
        String onboardingFromAirport,
        String arrivingToAirport,
        String flightId,
        String passengerName,
        String passengerEmail,
        String passengerType,
        String foodType,
        String paymentType,
        String fareId
    ){
        try {
            upsert new Booking__c(
                Id = bookingId,
                Booking_status__c = bookingStatus,
                Onboarding_From__c = onboardingFromAirport,
                Arriving_To__c = arrivingToAirport,
                Flight_Name__c = flightId,
                Passenger_Name__c = passengerName,
                Passenger_Email__c = passengerEmail,
                Passenger_Type__c = passengerType,
                Food_Type__c = foodType,
                Payment_Mode__c = paymentType,
                Fare_Type__c = fareId
            );
            
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static void cancelRecord(String bookingId){
        try {
            upsert new Booking__c(
                Id = bookingId,
                Booking_status__c = 'Cancelled'
            );
            
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}
