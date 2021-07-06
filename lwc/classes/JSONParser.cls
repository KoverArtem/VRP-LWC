/**
 * Created by Artem Koverchik on 2/21/2020.
 */

public with sharing class JSONParser implements ParsingService {

    public String parse(String data) {
        String tmp = '';
        String value = '';
        Map<String, Object> parsedData = new Map<String, Object>();

        data = data.substring(data.indexOf('\''), data.length() - 1);

        while (data != '') {
            tmp = data.substring(0, data.contains(',') ? data.indexOf(',') : data.length());

            value = tmp.substring(tmp.indexOf(':') + 1);
            value = value.contains('\'') ? value.substringBetween('\'') : value.trim();

            parsedData.put(tmp.substringBetween('\''), (Object) value);

            data = data.contains(',') ? data.substring(data.indexOf(',') + 1) : '';
        }

        return JSON.serialize(parsedData);
    }

}