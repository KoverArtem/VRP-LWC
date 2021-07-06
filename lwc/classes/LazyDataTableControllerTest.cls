/**
 * Created by Artem Koverchik on 2/10/2020.
 */
@isTest
public with sharing class LazyDataTableControllerTest {

    @isTest
    public static void testGetSobjectType() {
        Test.startTest();

        Account account = new Account(Name = 'Test Account');
        Contact contact = new Contact(LastName = 'Test Contact');

        insert account;
        insert contact;

        String sObjectType1 = LazyDataTableController.getSobjectType(account.Id);
        String sObjectType2 = LazyDataTableController.getSobjectType(contact.Id);

        System.assertEquals(sObjectType1, 'Account');
        System.assertEquals(sObjectType2, 'Contact');
        Test.stopTest();
    }
    @isTest
    public static void testGetCountSObject() {
        Test.startTest();

        List<Account> accounts = new List<Account>();

        for (Integer i = 0; i < 50; i++) {
            accounts.add(new Account(Name = 'Test'));
        }

        insert accounts;

        Integer accountSize = LazyDataTableController.getCountSObject('Account');

        System.assertEquals(accountSize, 50);
        Test.stopTest();
    }

    @isTest
    public static void testGetData() {
        Test.startTest();

        Account acc = new Account(Name = 'Test');
        insert acc;

        String jsonResponse = LazyDataTableController.getData('Account', LazyDataTableController.getFieldAccessWrappers('Account'), 10, 0);

        List<Account> accounts = (List<Account>) JSON.deserialize(jsonResponse, List<Account>.class);

        for (Account account: accounts) {
            System.assertEquals(account.Name, 'Test');
        }

        Test.stopTest();
    }

    @isTest
    public static void testGetObjectAccessWrapperWithFullAccess() {
        Test.startTest();

        Profile p = [SELECT Id FROM Profile WHERE Name='Profile For Test'];
        User user = new User(Alias = 'standt', Email='standarduser@testorg.com', EmailEncodingKey='UTF-8',
                LastName='Testing', LanguageLocaleKey='en_US', LocaleSidKey='en_US',
                ProfileId = p.Id, TimeZoneSidKey='America/Los_Angeles', Username='TestStandardTser@testorg.com');
        insert user;

        PermissionSet permissionSet = [SELECT Id FROM PermissionSet WHERE Name = 'Full_Access' LIMIT 1];

        PermissionSetAssignment psa = new PermissionSetAssignment(
                AssigneeId = user.Id,
                PermissionSetId = permissionSet.Id
        );

        insert psa;

        System.runAs(user) {
            LazyDataTableController.ObjectAccessWrapper accountWrapper =
                    (LazyDataTableController.ObjectAccessWrapper) JSON.deserialize(
                            LazyDataTableController.getObjectAccessWrapper('Account'),
                            LazyDataTableController.ObjectAccessWrapper.class
                    );

            System.assertEquals(accountWrapper.isCreatable, true);
            System.assertEquals(accountWrapper.isReadable, true);
            System.assertEquals(accountWrapper.isUpdatable, true);
            System.assertEquals(accountWrapper.isDeletable, true);

            LazyDataTableController.ObjectAccessWrapper contactWrapper =
                    (LazyDataTableController.ObjectAccessWrapper) JSON.deserialize(
                            LazyDataTableController.getObjectAccessWrapper('Contact'),
                            LazyDataTableController.ObjectAccessWrapper.class
                    );

            System.assertEquals(contactWrapper.isCreatable, true);
            System.assertEquals(contactWrapper.isReadable, true);
            System.assertEquals(contactWrapper.isUpdatable, true);
            System.assertEquals(contactWrapper.isDeletable, true);
        }
        Test.stopTest();
    }

    @isTest
    public static void testGetObjectAccessWrapperWithPartlyAccess() {
        Test.startTest();

        Profile p = [SELECT Id FROM Profile WHERE Name='Profile For Test'];
        User user = new User(Alias = 'standt', Email='standarduser@testorg.com', EmailEncodingKey='UTF-8',
                LastName='Testing', LanguageLocaleKey='en_US', LocaleSidKey='en_US',
                ProfileId = p.Id, TimeZoneSidKey='America/Los_Angeles', Username='TestStandardTser@testorg.com');
        insert user;

        PermissionSet permissionSet = [SELECT Id FROM PermissionSet WHERE Name = 'Partly_Access' LIMIT 1];

        PermissionSetAssignment psa = new PermissionSetAssignment(
                AssigneeId = user.Id,
                PermissionSetId = permissionSet.Id
        );

        insert psa;

        System.runAs(user) {
            LazyDataTableController.ObjectAccessWrapper accountWrapper =
                    (LazyDataTableController.ObjectAccessWrapper) JSON.deserialize(
                            LazyDataTableController.getObjectAccessWrapper('Account'),
                            LazyDataTableController.ObjectAccessWrapper.class
                    );

            System.assertEquals(accountWrapper.isCreatable, false);
            System.assertEquals(accountWrapper.isReadable, true);
            System.assertEquals(accountWrapper.isUpdatable, false);
            System.assertEquals(accountWrapper.isDeletable, false);

            LazyDataTableController.ObjectAccessWrapper contactWrapper =
                    (LazyDataTableController.ObjectAccessWrapper) JSON.deserialize(
                            LazyDataTableController.getObjectAccessWrapper('Contact'),
                            LazyDataTableController.ObjectAccessWrapper.class
                    );

            System.assertEquals(contactWrapper.isCreatable, true);
            System.assertEquals(contactWrapper.isReadable, true);
            System.assertEquals(contactWrapper.isUpdatable, true);
            System.assertEquals(contactWrapper.isDeletable, false);
        }
        Test.stopTest();
    }

    @isTest
    public static void testGetObjectAccessWrapperWithPartlyRead() {
        Test.startTest();

        Profile p = [SELECT Id FROM Profile WHERE Name='Profile For Test'];
        User user = new User(Alias = 'standt', Email='standarduser@testorg.com', EmailEncodingKey='UTF-8',
                LastName='Testing', LanguageLocaleKey='en_US', LocaleSidKey='en_US',
                ProfileId = p.Id, TimeZoneSidKey='America/Los_Angeles', Username='TestStandardTser@testorg.com');
        insert user;

        PermissionSet permissionSet = [SELECT Id FROM PermissionSet WHERE Name = 'Partly_Read' LIMIT 1];

        PermissionSetAssignment psa = new PermissionSetAssignment(
                AssigneeId = user.Id,
                PermissionSetId = permissionSet.Id
        );

        insert psa;

        System.runAs(user) {
            LazyDataTableController.ObjectAccessWrapper accountWrapper =
                    (LazyDataTableController.ObjectAccessWrapper) JSON.deserialize(
                            LazyDataTableController.getObjectAccessWrapper('Account'),
                            LazyDataTableController.ObjectAccessWrapper.class
                    );

            System.assertEquals(accountWrapper.isCreatable, false);
            System.assertEquals(accountWrapper.isReadable, true);
            System.assertEquals(accountWrapper.isUpdatable, false);
            System.assertEquals(accountWrapper.isDeletable, false);

            LazyDataTableController.ObjectAccessWrapper contactWrapper =
                    (LazyDataTableController.ObjectAccessWrapper) JSON.deserialize(
                            LazyDataTableController.getObjectAccessWrapper('Contact'),
                            LazyDataTableController.ObjectAccessWrapper.class
                    );

            System.assertEquals(contactWrapper.isCreatable, false);
            System.assertEquals(contactWrapper.isReadable, false);
            System.assertEquals(contactWrapper.isUpdatable, false);
            System.assertEquals(contactWrapper.isDeletable, false);
        }
        Test.stopTest();
    }

    @isTest
    public static void testGetFieldAccessWrapperWithFullAccess() {
        Test.startTest();

        Profile p = [SELECT Id FROM Profile WHERE Name='Profile For Test'];
        User user = new User(Alias = 'standt', Email='standarduser@testorg.com', EmailEncodingKey='UTF-8',
                LastName='Testing', LanguageLocaleKey='en_US', LocaleSidKey='en_US',
                ProfileId = p.Id, TimeZoneSidKey='America/Los_Angeles', Username='TestStandardTser@testorg.com');
        insert user;

        PermissionSet permissionSet = [SELECT Id FROM PermissionSet WHERE Name = 'Full_Access' LIMIT 1];

        PermissionSetAssignment psa = new PermissionSetAssignment(
                AssigneeId = user.Id,
                PermissionSetId = permissionSet.Id
        );

        insert psa;

        System.runAs(user) {
            List<LazyDataTableController.FieldAccessWrapper> accountFieldWrappers =
                    (List<LazyDataTableController.FieldAccessWrapper>) JSON.deserialize(
                            LazyDataTableController.getFieldAccessWrappers('Account'),
                            List<LazyDataTableController.FieldAccessWrapper>.class
                    );

            for (LazyDataTableController.FieldAccessWrapper wrapper : accountFieldWrappers) {
                if (wrapper.fieldName == 'Name') {
                    System.assertEquals(wrapper.isReadable, true);
                    System.assertEquals(wrapper.isUpdatable, true);
                } else if (wrapper.fieldName == 'OwnerId') {
                    System.assertEquals(wrapper.isReadable, true);
                    System.assertEquals(wrapper.isUpdatable, true);
                }
            }

            List<LazyDataTableController.FieldAccessWrapper> contactFieldWrappers =
                    (List<LazyDataTableController.FieldAccessWrapper>) JSON.deserialize(
                            LazyDataTableController.getFieldAccessWrappers('Contact'),
                            List<LazyDataTableController.FieldAccessWrapper>.class
                    );

            for (LazyDataTableController.FieldAccessWrapper wrapper : contactFieldWrappers) {
                if (wrapper.fieldName == 'Name') {
                    System.assertEquals(wrapper.isReadable, true);
                    System.assertEquals(wrapper.isUpdatable, true);
                } else if (wrapper.fieldName == 'OwnerId') {
                    System.assertEquals(wrapper.isReadable, true);
                    System.assertEquals(wrapper.isUpdatable, true);
                }
            }


        }
        Test.stopTest();
    }

    @isTest
    public static void testGetFieldAccessWrapperWithPartlyAccess() {
        Test.startTest();

        Profile p = [SELECT Id FROM Profile WHERE Name='Profile For Test'];
        User user = new User(Alias = 'standt', Email='standarduser@testorg.com', EmailEncodingKey='UTF-8',
                LastName='Testing', LanguageLocaleKey='en_US', LocaleSidKey='en_US',
                ProfileId = p.Id, TimeZoneSidKey='America/Los_Angeles', Username='TestStandardTser@testorg.com');
        insert user;

        PermissionSet permissionSet = [SELECT Id FROM PermissionSet WHERE Name = 'Partly_Access' LIMIT 1];

        PermissionSetAssignment psa = new PermissionSetAssignment(
                AssigneeId = user.Id,
                PermissionSetId = permissionSet.Id
        );

        insert psa;

        System.runAs(user) {
            List<LazyDataTableController.FieldAccessWrapper> accountFieldWrappers =
                    (List<LazyDataTableController.FieldAccessWrapper>) JSON.deserialize(
                            LazyDataTableController.getFieldAccessWrappers('Account'),
                            List<LazyDataTableController.FieldAccessWrapper>.class
                    );

            for (LazyDataTableController.FieldAccessWrapper wrapper : accountFieldWrappers) {
                if (wrapper.fieldName == 'Name') {
                    System.assertEquals(wrapper.isReadable, true);
                    System.assertEquals(wrapper.isUpdatable, false);
                } else if (wrapper.fieldName == 'OwnerId') {
                    System.assertEquals(wrapper.isReadable, true);
                    System.assertEquals(wrapper.isUpdatable, false);
                }
            }

            List<LazyDataTableController.FieldAccessWrapper> contactFieldWrappers =
                    (List<LazyDataTableController.FieldAccessWrapper>) JSON.deserialize(
                            LazyDataTableController.getFieldAccessWrappers('Contact'),
                            List<LazyDataTableController.FieldAccessWrapper>.class
                    );

            for (LazyDataTableController.FieldAccessWrapper wrapper : contactFieldWrappers) {
                if (wrapper.fieldName == 'Name') {
                    System.assertEquals(wrapper.isReadable, true);
                    System.assertEquals(wrapper.isUpdatable, true);
                } else if (wrapper.fieldName == 'OwnerId') {
                    System.assertEquals(wrapper.isReadable, true);
                    System.assertEquals(wrapper.isUpdatable, true);
                }
            }


        }
        Test.stopTest();
    }

    @isTest
    public static void testGetFieldAccessWrapperWithPartlyRead() {
        Test.startTest();

        Profile p = [SELECT Id FROM Profile WHERE Name='Profile For Test'];
        User user = new User(Alias = 'standt', Email='standarduser@testorg.com', EmailEncodingKey='UTF-8',
                LastName='Testing', LanguageLocaleKey='en_US', LocaleSidKey='en_US',
                ProfileId = p.Id, TimeZoneSidKey='America/Los_Angeles', Username='TestStandardTser@testorg.com');
        insert user;

        PermissionSet permissionSet = [SELECT Id FROM PermissionSet WHERE Name = 'Partly_Read' LIMIT 1];

        PermissionSetAssignment psa = new PermissionSetAssignment(
                AssigneeId = user.Id,
                PermissionSetId = permissionSet.Id
        );

        insert psa;

        System.runAs(user) {
            List<LazyDataTableController.FieldAccessWrapper> accountFieldWrappers =
                    (List<LazyDataTableController.FieldAccessWrapper>) JSON.deserialize(
                            LazyDataTableController.getFieldAccessWrappers('Account'),
                            List<LazyDataTableController.FieldAccessWrapper>.class
                    );
            System.debug(accountFieldWrappers);
            for (LazyDataTableController.FieldAccessWrapper wrapper : accountFieldWrappers) {
                if (wrapper.fieldName == 'Name') {
                    System.assertEquals(wrapper.isReadable, true);
                    System.assertEquals(wrapper.isUpdatable, false);
                } else if (wrapper.fieldName == 'OwnerId') {
                    System.assertEquals(wrapper.isReadable, true);
                    System.assertEquals(wrapper.isUpdatable, false);
                }
            }

            List<LazyDataTableController.FieldAccessWrapper> contactFieldWrappers =
                    (List<LazyDataTableController.FieldAccessWrapper>) JSON.deserialize(
                            LazyDataTableController.getFieldAccessWrappers('Contact'),
                            List<LazyDataTableController.FieldAccessWrapper>.class
                    );

            for (LazyDataTableController.FieldAccessWrapper wrapper : contactFieldWrappers) {
                if (wrapper.fieldName == 'Name') {
                    System.assertEquals(wrapper.isReadable, false);
                    System.assertEquals(wrapper.isUpdatable, false);
                } else if (wrapper.fieldName == 'OwnerId') {
                    System.assertEquals(wrapper.isReadable, false);
                    System.assertEquals(wrapper.isUpdatable, false);
                }
            }


        }
        Test.stopTest();
    }
}

