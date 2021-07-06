/**
 * Created by Artem Koverchik on 2/19/2020.
 */

public with sharing class CaseCategoriesController {

    public class DependentPickListValueWrapper {
        Boolean active;
        Boolean defaultValue;
        String label;
        String validFor;
        String isDefaultValue;
    }

    @AuraEnabled
    public static Map<String,List<String>> getDependentOptions(){
        Map<String,List<String>> objResults = new Map<String,List<String>>();
        //get the string to sobject global map
        Map<String,Schema.SObjectType> objGlobalMap = Schema.getGlobalDescribe();
        if (!objGlobalMap.containsKey('Case')) {
            return objResults;
        }
        //get the type being dealt with
        Schema.SObjectType pType = objGlobalMap.get('Case');
        Map<String, Schema.SObjectField> objFieldMap = pType.getDescribe().fields.getMap();
        //verify field names
        if (!objFieldMap.containsKey('Status') || !objFieldMap.containsKey('ArtemK__Subcategories__c')) {
            return objResults;
        }
        //get the control values
        List<Schema.PicklistEntry> ctrl_ple = objFieldMap.get('Status').getDescribe().getPicklistValues();
        //get the dependent values
        List<Schema.PicklistEntry> dep_ple = objFieldMap.get('ArtemK__Subcategories__c').getDescribe().getPicklistValues();
        //iterate through the values and get the ones valid for the controlling field name
        BitSet objBitSet = new BitSet();
        //set up the results
        for(Integer pControllingIndex=0; pControllingIndex<ctrl_ple.size(); pControllingIndex++){
            //get the pointer to the entry
            Schema.PicklistEntry ctrl_entry = ctrl_ple[pControllingIndex];
            //get the label
            String pControllingLabel = ctrl_entry.getLabel();
            if (pControllingLabel != 'Closed') {
                //create the entry with the label
                objResults.put(pControllingLabel,new List<String>());
            }
        }
        //cater for null and empty
        /*objResults.put('',new List<String>());
        objResults.put(null,new List<String>());*/
        //check the dependent values
        for(Integer pDependentIndex=0; pDependentIndex<dep_ple.size(); pDependentIndex++){
            //get the pointer to the dependent index
            Schema.PicklistEntry dep_entry = dep_ple[pDependentIndex];
            //get the valid for
            String pEntryStructure = JSON.serialize(dep_entry);
            DependentPickListValueWrapper objDepPLE = (DependentPickListValueWrapper)JSON.deserialize(pEntryStructure, DependentPickListValueWrapper.class);
            //if valid for is empty, skip
            if (objDepPLE.validFor==null || objDepPLE.validFor==''){
                continue;
            }
            //iterate through the controlling values
            for(Integer pControllingIndex=0; pControllingIndex<ctrl_ple.size(); pControllingIndex++){
                if (objBitSet.testBit(objDepPLE.validFor,pControllingIndex)){
                    //get the label
                    String pControllingLabel = ctrl_ple[pControllingIndex].getLabel();
                    objResults.get(pControllingLabel).add(objDepPLE.label);
                }
            }
        }
        return objResults;
    }


    @AuraEnabled
    public static void setCaseCategories(List<String> caseCategoriesStrings, String caseId) {
        List<CaseCategories__c> caseCategories = new List<CaseCategories__c>();

        for (String category : caseCategoriesStrings) {

            if (CaseCategories__c.getInstance(category) == null) {
                caseCategories.add(new CaseCategories__c(Name = category, CaseId__c = caseId));
            }
        }

        insert caseCategories;
    }

    @AuraEnabled
    public static List<String> getCaseCategories(String caseId) {
        List<String> caseCategoriesStrings = new List<String>();

        for (CaseCategories__c category : [SELECT Name FROM CaseCategories__c WHERE CaseId__c =: caseId]) {
            caseCategoriesStrings.add(category.Name);
        }

        return caseCategoriesStrings;
    }

    @AuraEnabled
    public static void deleteCaseCategory(String name) {
        CaseCategories__c caseCategory = CaseCategories__c.getInstance(name);
        if (caseCategory != null) {
            delete caseCategory;
        }
    }

}