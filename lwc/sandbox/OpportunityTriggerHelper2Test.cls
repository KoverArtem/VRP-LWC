/**
 * Created by ArtemKoverchik on 8/13/2021.
 */

@IsTest
public with sharing class OpportunityTriggerHelper2Test {

    @IsTest
    public static void testUpdateLeadSourceFromFirstOpportunity() {

        List<Opportunity> opportunities = createData();

        OpportunityTriggerHelper2 opportunityTriggerHelper2 = new OpportunityTriggerHelper2();
        opportunityTriggerHelper2.updateLeadSourceFromFirstOpportunity(opportunities);

        for (Opportunity item : opportunities) {
            System.debug(item.LeadSource);
            System.assertEquals('Employee Referral', item.LeadSource);
            System.assertEquals('Clutch', item.LeadSource);
        }


    }

    private static List<Opportunity> createData() {
        List<Account> accounts = new List<Account>();

        Account acc1 = new Account(Name = 'test acc 1');
        Account acc2 = new Account(Name = 'test acc 2');

        accounts.add(acc1);
        accounts.add(acc2);

        insert accounts;

        List<Opportunity> opportunities = new List<Opportunity>();

        Opportunity opp1 = new Opportunity(
                Name = 'test opp 1', Type = 'Project', AccountId = acc1.Id,
                CloseDate = Date.newInstance(2012, 12, 31),
                StageName = 'Won', TSS_Involvement__c = 'No', LeadSource = 'Employee Referral'
        );
        Opportunity opp2 = new Opportunity(
                Name = 'test opp 2', Type = 'Project', AccountId = acc1.Id,
                CloseDate = Date.newInstance(2012, 12, 31),
                StageName = 'Won', TSS_Involvement__c = 'No', LeadSource = 'Google Ad'
        );
        Opportunity opp3 = new Opportunity(
                Name = 'test opp 3', Type = 'Project', AccountId = acc2.Id,
                CloseDate = Date.newInstance(2012, 12, 31),
                StageName = 'Won', TSS_Involvement__c = 'No', LeadSource = 'Clutch'
        );
        Opportunity opp4 = new Opportunity(
                Name = 'test opp 4', Type = 'Project', AccountId = acc2.Id,
                CloseDate = Date.newInstance(2012, 12, 31),
                StageName = 'Won', TSS_Involvement__c = 'No', LeadSource = 'Web'
        );
        Opportunity opp5 = new Opportunity(
                Name = 'test opp 5', Type = 'Project', AccountId = acc2.Id,
                CloseDate = Date.newInstance(2012, 12, 31),
                StageName = 'Won', TSS_Involvement__c = 'No', LeadSource = 'External Sales'
        );

        /*opportunities.add(opp1);
        opportunities.add(opp2);
        opportunities.add(opp3);
        opportunities.add(opp4);
        opportunities.add(opp5);*/
        insert opp1;
        insert opp2;
        insert opp3;
        insert opp4;
        insert opp5;

        //insert opportunities;

        opportunities.add(opp2);
        opportunities.add(opp5);

        return opportunities;
    }
}