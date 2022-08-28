public with sharing class airportControllerRaj {
    @AuraEnabled(cacheable=true)
    public static List<Airport__c> fetchAllRecords(){
        try {
            return [SELECT Name FROM Airport__c ORDER BY Name];
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<Airport__c> fetchThisRecord(String recordId){
        try {
            if (string.isNotBlank(recordId)) {
                return [SELECT Name FROM Airport__c WHERE Id = :recordId];
            }
            return null;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static void upsertRecord(String recordId, String airportCity){
        try {
            upsert new Airport__c(Id=recordId, Name=airportCity);
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}
