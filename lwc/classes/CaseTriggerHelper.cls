/**
 * Created by Artem Koverchik on 2/21/2020.
 */

public with sharing class CaseTriggerHelper {

    public static void publishEvent(List<Case> cases) {
        List<Case_Event__e> events = new List<Case_Event__e>();

        for (Case item : cases) {
            if (item.Subject == 'Parsed') {
                events.add(new Case_Event__e(Data__c = item.Description, CaseId__c = item.Id));
            }
        }

        EventBus.publish(events);
    }

}