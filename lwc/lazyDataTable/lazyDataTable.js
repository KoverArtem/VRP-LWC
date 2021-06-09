/**
 * Created by Artem Koverchik on 2/6/2020.
 */

import {LightningElement, api, track} from 'lwc';
import getSobjectType from '@salesforce/apex/LazyDataTableController.getSobjectType';
import getCountSObject from '@salesforce/apex/LazyDataTableController.getCountSObject';
import getData from '@salesforce/apex/LazyDataTableController.getData';
import deleteRecord from '@salesforce/apex/LazyDataTableController.deleteRecords';
import getObjectAccessWrapper from '@salesforce/apex/LazyDataTableController.getObjectAccessWrapper';
import getFieldAccessWrappers from '@salesforce/apex/LazyDataTableController.getFieldAccessWrappers';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class LazyDataTable extends LightningElement {

    @track loaded = false;
    sobjectCount;

    @api pageSizes = [
        { label: '10', value: '9', id: '1' },
        { label: '25', value: '24', id: '2' },
        { label: '50', value: '49', id: '3' },
    ];

    formFields = [];

    @api recordId;
    objectName;
    @track object = {};
    @track fields;
    isAllFieldsAvailable = true;

    @track data = [];
    @track columns = [];
    @track selectedRows = [];
    @track pageSize = 9;

    @track rowOffset = 0;
    allData = [];
    @track currentPageNumber = 1;
    @track totalPages = 0;
    @track pageList;

    @track createRecordPopUp = false;
    @track updateRecordPopUp = false;
    @track recordToUpdate;
    @track recordToCreate = {
        Name: '',
        OwnerId: ''
    };

    @track name;
    @track ownerId;

    connectedCallback() {
        getSobjectType({recordId: this.recordId})
            .then(data => {
                console.log(data);
                this.objectName = data;

                getObjectAccessWrapper({objectName: this.objectName})
                    .then(data => {
                        console.log(JSON.parse(data + ''));
                        this.object = JSON.parse(data + '');

                        getFieldAccessWrappers({objectName: this.objectName})
                            .then(data => {
                                console.log(JSON.parse(data + ''));
                                this.fields = JSON.parse(data + '');

                                let options = [];

                                options.push(
                                    {label: 'Id', fieldName: 'Id'},
                                    {label: 'Name', fieldName: 'Name'},
                                    {label: 'Owner', fieldName: 'OwnerName'}
                                );

                                options.push({
                                    label: 'Edit',
                                    type: 'button',
                                    typeAttributes: {
                                        label: 'Edit',
                                        value: 'edit',
                                        disabled: !this.object.isUpdatable
                                    },
                                    fixedWidth: 100
                                });

                                options.push({
                                    label: 'Delete',
                                    type: 'button',
                                    typeAttributes: {
                                        label: 'Delete',
                                        value: 'delete',
                                        disabled: !this.object.isDeletable
                                    },
                                    fixedWidth: 100
                                });

                                this.columns = options;
                                this.loaded = true;
                                this.getRecords();
                                console.log(options);
                            })
                            .catch(error => {
                                console.log('ERROR get Fields');
                                console.log(error);
                                this.loaded = true;
                            });
                    })
                    .catch(error => {
                        console.log('ERROR get Object');
                        console.log(error);
                    });
                getCountSObject({objectName: this.objectName})
                    .then(data => {
                        this.sobjectCount = data;
                        this.totalPages = Math.ceil(this.sobjectCount / (this.pageSize + 1));
                        this.currentPageNumber = 1;
                    })
                    .catch(error => {
                        console.log('ERROR');
                        console.log(error);
                    });

                if (this.objectName === 'Contact') {
                    this.formFields = [
                        {fieldApiName: 'LastName', objectApiName: this.objectName},
                        {fieldApiName: 'FirstName', objectApiName: this.objectName},
                        {fieldApiName: 'OwnerId', objectApiName: this.objectName}
                    ];
                } else {
                    this.formFields = [
                        {fieldApiName: 'Name', objectApiName: this.objectName},
                        {fieldApiName: 'OwnerId', objectApiName: this.objectName}
                    ];
                }
            })
            .catch(error => {
                console.log('ERROR');
                console.log(error);
                this.loaded = true;
            })
    }

    renderedCallback() {
        this.showCurrentPageNumber();
    }

    getRecords(event) {
        this.loaded = false;

        if (event) {
            this.pageSize = event.target.value;
            this.rowOffset = 0;
            this.totalPages = Math.ceil(this.sobjectCount / (+this.pageSize + 1));
            this.currentPageNumber = 1;
        }

        getData({
            sobjectType: this.objectName,
            JSONFields: JSON.stringify(this.fields),
            pageSize: +this.pageSize + 1,
            offSetSize: this.rowOffset
        }).then(data => {
            console.log(JSON.parse(data + ''));
            this.loaded = true;
            this.data = JSON.parse(data + '');
            this.generatePageList(this.currentPageNumber);

            if (!this.isAllFieldsAvailable) {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success',
                            message: 'Records successfully were got, but some fields aren\'t available for you',
                            variant: 'warning'
                        })
                    );
                }

            })
            .catch(error => {
                console.log('ERROR');
                console.log(error);
                this.loaded = true;

                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: 'Something went wrong!',
                        variant: 'error'
                    })
                );
            })
    }

    callRowAction(event) {

        const recordId =  event.detail.row.Id;
        const actionName = event.detail.action.value;

        if (actionName === 'delete') {
            deleteRecord({recordId: recordId, objectName: this.objectName})
                .then(() => {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success',
                            message: 'Record deleted!',
                            variant: 'success'
                        })
                    );

                    this.getRecords();
                })
                .catch(error => {
                    console.log('ERROR');
                    console.log(error);

                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Error',
                            message: 'Something went wrong!',
                            variant: 'error'
                        })
                    )
                })
        } else if (actionName === 'edit') {
            this.updateRecordPopUp = true;

            this.recordToUpdate = this.data.find(item => item.Id === recordId);

            this.dispatchEvent(new CustomEvent('cancel'));

            console.log(this.recordToUpdate);
        }
    }

    handleSubmit(event) {
        const fields = event.detail.fields;
        this.template.querySelector('lightning-record-form').submit(fields);

        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success!',
                message: 'Record updated!',
                variant: 'success'
            })
        );

        this.loaded = false;

        this.timeout = setTimeout(function() {
            this.getRecords();
        }.bind(this), 500);


        this.updateRecordPopUp = false;
    }

    handleSuccess() {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success!',
                message: 'Record saved!',
                variant: 'success'
            })
        );

        this.getRecords();
        this.createRecordPopUp = false;
    }

    handleError() {
        this.recordToCreate = false;
        this.recordToUpdate = false;

        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message: 'Something went wrong!',
                variant: 'error'
            })
        )
    }

    hideUpdatePopUp() {
        this.updateRecordPopUp = false;
    }

    showPopUp() {
        this.createRecordPopUp = true;
        this.dispatchEvent(new CustomEvent('cancel'));


    }

    hidePopUp() {
        this.createRecordPopUp = false;
    }

    generatePageList(pageNumber) {
        pageNumber = parseInt(pageNumber);

        let pageList = [];
        let totalPages = this.totalPages;

        if (totalPages > 1) {
            if (totalPages <= 10) {
                let counter = 2;
                for (; counter < (totalPages); counter++) {
                    pageList.push(counter);
                }
            } else {
                if (pageNumber < 5) {
                    pageList.push(2, 3, 4, 5, 6);
                } else {
                    if (pageNumber > (totalPages - 5)) {
                        pageList.push(totalPages - 5, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1);
                    } else {
                        pageList.push(pageNumber - 2, pageNumber - 1, pageNumber, pageNumber + 1, pageNumber + 2);
                    }
                }
            }
        }

        this.pageList = pageList;

    }

    onNext() {
        this.currentPageNumber += 1;
        this.rowOffset += +this.pageSize + 1;
        this.getRecords()

    }

    onPrev() {
        this.currentPageNumber -= 1;
        this.rowOffset -= +this.pageSize + 1;
        this.getRecords();
    }

    processMe(event) {
        this.currentPageNumber = parseInt(event.target.name);
        this.rowOffset = (+this.pageSize + 1) * (this.currentPageNumber - 1);
        this.getRecords();
    }

    onFirst() {
        this.currentPageNumber = 1;
        this.rowOffset = 0;
        this.getRecords();
    }

    onLast() {
        this.currentPageNumber = this.totalPages;
        this.rowOffset = (+this.totalPages - 1) * 10;
        this.getRecords();
    }

    get isCurrentPageNumberLast() {
        return this.currentPageNumber === this.totalPages;
    }

    get isCurrentPageNumberFirst() {
        return this.currentPageNumber === 1;
    }

    get isTotalPagesMoreThenOne() {
        return this.totalPages > 1;
    }

    get isDataExist() {
        return this.data.length && this.object.isReadable;
    }

    get isReadAccept() {
        return this.object.isReadable;
    }

    get nameObject() {
        return `NEW ${this.objectName}`;
    }

    get isCreateAccept() {
        return !this.object.isCreatable;
    }

    get isReadable() {
        return this.object.isReadable;
    }

    get isCurrentPageMoreThenFour() {
        return +this.currentPageNumber > 4;
    }

    get isCurrentPageLessThenTotalPages() {
        return +this.currentPageNumber < this.totalPages - 4;
    }

    showCurrentPageNumber() {
        this.template.querySelectorAll('span.slds-p-horizontal_x-small a').forEach(item => {
            if (+item.innerText === +this.currentPageNumber) {
                item.classList.add('currentPage');
            } else {
                item.classList.remove('currentPage');
            }
        });
    }


}