/**
 * Created by Artem Koverchik on 2/3/2020.
 */

public with sharing class LeadTriggerHelper {

    public static void notifyOnLeadCreation(Map<Id, Lead> idToLeads, Boolean isLeadCreated) {

        LoggingSystemController.log(idToLeads, isLeadCreated);
    }

    public static void notifyOnLeadConvertation(Map<Id, Lead> idToLeads, List<Lead> oldLeads, Boolean isLeadCreated) {

        for (Lead oldLead : oldLeads) {
            if (!oldLead.IsConverted && !idToLeads.get(oldLead.Id).IsConverted) {
                idToLeads.remove(oldLead.Id);
            }
        }

        if (idToLeads.size() > 0) {
            LoggingSystemController.log(idToLeads, isLeadCreated);
        }
    }
}