/**
 * Created by Artem Koverchik on 2/21/2020.
 */

public with sharing class XMLParser implements ParsingService {

    public String parse(String data) {
        String tagName = '';
        String innerText = '';
        Map<String, Object> parsedData = new Map<String, Object>();

        while (data.contains('>')) {
            tagName = data.substringBetween('<', '>');

            innerText = data.substringBetween('>', '<');

            parsedData.put(tagName, innerText);

            data = data.substring(data.indexOf('/') + tagName.length() + 2);
        }

        return JSON.serialize(parsedData);
    }

}