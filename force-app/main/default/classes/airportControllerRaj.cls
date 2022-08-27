public with sharing class airportControllerRaj {
    @AuraEnabled(cacheable=true)
    public static List<Airport__c> fetchAllAirports(){
        try {
            return [SELECT Name FROM Airport__c ORDER BY Name];
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled(cacheable=true)
    public static String fetchAirportName(String airportId){
        try {
            return [SELECT Name FROM Airport__c WHERE Id = :airportId][0].Name;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}
