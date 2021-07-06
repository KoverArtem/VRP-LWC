/**
 * Created by Artem Koverchik on 2/21/2020.
 */
@RestResource(urlMapping='/CaseManager/*')
global with sharing class CaseManager {

    private static Map<String, ParsingService> strategies = new Map<String, ParsingService>{
            'JSON' => (JSONParser) Type.forName('JSONParser').newInstance(),
            'XML' => (XMLParser) Type.forName('XMLParser').newInstance()
    };

    @HttpPost
    global static Id createCase(String data) {
        System.debug(data);

        Case newCase = new Case(Subject = 'Parsed');

        Boolean isJSON = data.trim().substring(0, 1) == '{';

        System.debug(isJSON);

        ParsingService parser = strategies.get(isJSON ? 'JSON' : 'XML') ;

        newCase.Description = parser.parse(data);

        System.debug(newCase.Description);

        insert newCase;

        return newCase.Id;
    }

}