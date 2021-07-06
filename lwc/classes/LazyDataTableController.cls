/**
 * Created by Artem Koverchik on 2/6/2020.
 */

public with sharing class LazyDataTableController {

    public class ObjectAccessWrapper {
        public String objectName;
        public Boolean isCreatable;
        public Boolean isReadable;
        public Boolean isUpdatable;
        public Boolean isDeletable;

        public ObjectAccessWrapper(String objectName, Boolean isCreatable, Boolean isReadable, Boolean isUpdatable, Boolean isDeletable) {
            this.objectName = objectName;
            this.isCreatable = isCreatable;
            this.isReadable = isReadable;
            this.isUpdatable = isUpdatable;
            this.isDeletable = isDeletable;
        }
    }

    public class FieldAccessWrapper {
        public String fieldName;
        public Boolean isReadable;
        public Boolean isUpdatable;

        public FieldAccessWrapper(String fieldName, Boolean isReadable, Boolean isUpdatable) {
            this.fieldName = fieldName;
            this.isReadable = isReadable;
            this.isUpdatable = isUpdatable;
        }
    }

    public class RecordWrapper {
        Id Id;
        String Name;
        String OwnerId;
        String OwnerName;

        public RecordWrapper(Id recordId, String Name, String OwnerId, String OwnerName) {
            this.Id = recordId;
            this.Name = Name;
            this.OwnerId = OwnerId;
            this.OwnerName = OwnerName;
        }
    }

    @AuraEnabled
    public static String getSobjectType(Id recordId) {
        return recordId.getSobjectType().getDescribe().getName();
    }

    @AuraEnabled
    public static Integer getCountSObject(String objectName) {
        return Database.countQuery('SELECT COUNT() FROM ' + objectName);
    }

    @AuraEnabled
    public static String getObjectAccessWrapper(String objectName) {
        DescribeSObjectResult result = Schema.getGlobalDescribe().get(objectName).getDescribe();

        Boolean isCreatable = result.isCreateable();
        //Boolean isCreatable = false;
        Boolean isReadable = result.isAccessible();
        //Boolean isReadable = false;
        Boolean isUpdatable = result.isUpdateable();
        //Boolean isUpdatable = false;
        Boolean isDeletable = result.isDeletable();
        //Boolean isDeletable = false;

        return JSON.serialize(new ObjectAccessWrapper(objectName, isCreatable, isReadable, isUpdatable, isDeletable));
    }

    @AuraEnabled
    public static String getFieldAccessWrappers(String objectName) {
        DescribeSObjectResult result = Schema.getGlobalDescribe().get(objectName).getDescribe();
        List<FieldAccessWrapper> fieldsWrappers = new List<LazyDataTableController.FieldAccessWrapper>();
        List<String> fields = new List<String> {'Name', 'OwnerId'};

        for (String field : fields) {
            Boolean isReadable = result.isAccessible();
            Boolean isUpdatable = result.isUpdateable();
            fieldsWrappers.add(new FieldAccessWrapper(field, isReadable, isUpdatable));
        }

        //fieldsWrappers[0].isUpdatable = false;
        //fieldsWrappers[1].isUpdatable = false;

        return JSON.serialize(fieldsWrappers);
    }

    @AuraEnabled
    public static String getData(String sobjectType, String JSONFields, Integer pageSize, Integer offSetSize) {
        List<FieldAccessWrapper> fields = (List<FieldAccessWrapper>) JSON.deserialize(JSONFields, List<FieldAccessWrapper>.class);
        List<RecordWrapper> wrappers = new List<LazyDataTableController.RecordWrapper>();
        String fieldsString = '';

        for (FieldAccessWrapper item : fields) {
            fieldsString += item.isReadable ? item.fieldName + ', ' : '';
        }

        String queryString = '' +
                'SELECT ' +
                    (fieldsString.length() > 0 ? fieldsString + 'Owner.Name, Id' : 'Owner.Name, Id') +
                ' FROM ' + sobjectType +
                ' LIMIT :pageSize' + ' OFFSET :offSetSize';

        List<SObject> records = Database.query(queryString);

        for (SObject record : records) {
            wrappers.add(
                    new RecordWrapper(
                            record.Id,
                            (String) record.get('Name'),
                            (String) record.get('OwnerId'),
                            (String) record.getSObject('Owner').get('Name')
                    )
            );
        }

        return JSON.serialize(wrappers);
    }

    @AuraEnabled
    public static void deleteRecords(String recordId, String objectName) {

        if (objectName == 'Account') {
            delete [SELECT Id FROM Case WHERE AccountId =: recordId];
            delete [SELECT Id FROM Opportunity WHERE AccountId =: recordId];
            delete [SELECT Id FROM Account WHERE Id =: recordId];
        } else if (objectName == 'Contact') {
            delete [SELECT Id FROM Case WHERE ContactId =: recordId];
            delete [SELECT Id FROM Opportunity WHERE ContactId =: recordId];
            delete [SELECT Id FROM Contact WHERE Id =: recordId];
        }

    }


}