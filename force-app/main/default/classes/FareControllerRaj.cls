public with sharing class FareControllerRaj {
    @AuraEnabled(cacheable=true)
    public static List<Map<String, String>> fetchAllRecords(){
        try {
            List<Fare__c> myFares = [SELECT Name, Flight__r.Name, Passenger_Type__c FROM Fare__c];

            
            List<Map<String, String>> myFareLabelMapList = new List<Map<String, String>>();

            for (Fare__c f : myFares) {
                Map<String, String> tmpFareMap = new Map<String, String>{
                    'Name' => f.Flight__r.Name + '/' + f.Name + '/' + f.Passenger_Type__c,
                    'Id' => f.Id
                };
                //myFareLabelMap.put(f.Flight__r.Name + '/' + f.Name + '/' + f.Passenger_Type__c, f.Id);
                myFareLabelMapList.add(tmpFareMap);
            }

            return myFareLabelMapList;

            
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<Fare__c> fetchThisRecord(String recordId){
        try {
            if (string.isNotBlank(recordId)) {
                return [SELECT Name, Flight__r.Name, Passenger_Type__c,Price__c FROM Fare__c WHERE Id = :recordId];
            }
            return null;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static void upsertRecord(
        String fareId,
        String fareType,
        String flightId,
        String passengerType,
        Decimal price
    ){
        try {
            upsert new Fare__c(
                Id = fareId,
                Name = fareType,
                Flight__c = flightId,
                Passenger_Type__c = passengerType,
                Price__c = price
            );
            
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

}
