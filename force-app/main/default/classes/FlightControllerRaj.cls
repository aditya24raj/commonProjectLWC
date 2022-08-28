public with sharing class FlightControllerRaj {
    //TEXT(HOUR(  Arrival_Time__c  ) - HOUR(  Depart_Time__c  )) & 'h ' &  TEXT( MINUTE( Arrival_Time__c ) - MINUTE( Depart_Time__c ) ) & 'm'
    @AuraEnabled(cacheable=true)
    public static List<Flight__c> fetchAllRecords(){
        try {
            return [SELECT Name FROM Flight__c ORDER BY Name];
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<Flight__c> fetchThisRecord(String recordId){
        try {
            if (string.isNotBlank(recordId)) {
                return [SELECT Name, Flight_Status__c, Onboarding_From__r.Name, Arriving_To__r.Name, Arrival_Time__c, Depart_Time__c, Duration__c FROM Flight__c WHERE Id = :recordId];
            }
            return null;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static void upsertRecord(
        String flightId,
        String flightStatus,
        String onboardingFrom,
        String arrivingTo,
        Integer onboardingTimeHH,
        Integer onboardingTimeMM,
        Integer arrivalTimeHH,
        Integer arrivalTimeMM
    ){
        try {
            upsert new Flight__c(
                Id = flightId,
                Flight_Status__c = flightStatus,
                Onboarding_From__c = onboardingFrom,
                Arriving_To__c = arrivingTo,
                Depart_Time__c = Time.newInstance(onboardingTimeHH, onboardingTimeMM, 0, 0),
                Arrival_Time__c = Time.newInstance(arrivalTimeHH, arrivalTimeMM, 0, 0)
            );
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}
