/**
 * Created by Artem Koverchik on 1/27/2020.
 */

public without sharing class soqlBuilderLWCController {

    class FieldsWrapper {
        String fieldName;
        String fieldType;

        public FieldsWrapper(String fieldName, String fieldType) {
            this.fieldName = fieldName;
            this.fieldType = fieldType;
        }
    }

    @AuraEnabled(Cacheable = true)
    public static List<String> getObjectsName() {
        List<String> objects = new List<String>();

        for (Schema.SObjectType item : Schema.getGlobalDescribe().values()) {
            Schema.DescribeSObjectResult result = item.getDescribe();

            if (result.isSearchable() && result.isCreateable()) {
                objects.add(result.getName());
            }
        }

        objects.sort();

        return objects;
    }

    @AuraEnabled(Cacheable = true)
    public static String getObjectFields(String objectName) {
        List<FieldsWrapper> objectFields = new List<FieldsWrapper>();
        Map<String, SObjectField> fields = Schema.getGlobalDescribe().get(objectName).getDescribe().fields.getMap();

        for (String s : fields.keySet()) {

            SObjectField fieldToken = fields.get(s);
            DescribeFieldResult selectedField = fieldToken.getDescribe();

            if (selectedField.isAccessible()) {
                objectFields.add(new FieldsWrapper(selectedField.getName(), String.valueOf(selectedField.getType())));
            }
        }

        return JSON.serialize(objectFields);
    }

    @AuraEnabled
    public static List<SObject> getRecords(String soqlString) {
        return Database.query(soqlString);
    }
}