/**
 * Created by ArtemKoverchik on 8/13/2021.
 */

public with sharing class OpportunityTriggerHelper2 {

    public void updateLeadSourceFromFirstOpportunity (List <Opportunity> listOpportunityNew) {


        /*for (Opportunity o : listOpportunityNew) {
            if (o.AccountId != null) {
                List <Opportunity> oppHaveTheSameParentAccount =
                        new List <Opportunity> ([SELECT Id, Name, AccountId, LeadSource FROM Opportunity WHERE AccountId =: o.AccountId]);

                if (oppHaveTheSameParentAccount.size()>0) {
                    Opportunity first = oppHaveTheSameParentAccount.get(0);
                    o.LeadSource = oppHaveTheSameParentAccount.get(0).LeadSource;
                }

            }
        }*/

        Set<Id> opportunityAccountIds = new Set<Id>();
        Map<Id, List<Opportunity>> accountIdToOpportunities = new Map<Id, List<Opportunity>>();

        for (Opportunity item : listOpportunityNew) {
            if (item.AccountId != null) {
                opportunityAccountIds.add(item.AccountId);
            }
        }

        List<Opportunity> opportunities = [
                SELECT Id, LeadSource, AccountId
                FROM Opportunity
                WHERE AccountId IN: opportunityAccountIds
                ORDER BY CreatedDate
        ];

        for (Opportunity item : opportunities) {
            if (accountIdToOpportunities.containsKey(item.AccountId)) {
                accountIdToOpportunities.get(item.AccountId).add(item);
            } else {
                List<Opportunity> opportunitiesWithTheSameAccount = new List<Opportunity>();
                opportunitiesWithTheSameAccount.add(item);
                accountIdToOpportunities.put(item.AccountId, opportunitiesWithTheSameAccount);
            }
        }

        for (Id accountId : accountIdToOpportunities.keySet()) {
            for (Opportunity item : listOpportunityNew) {
                if (accountId == item.AccountId) {
                    item.LeadSource = accountIdToOpportunities.get(item.AccountId).get(0).LeadSource;
                }
            }
        }

    }
}