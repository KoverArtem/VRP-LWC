import {LightningElement, api, track} from 'lwc';

import getObjectsName from '@salesforce/apex/soqlBuilderLWCController.getObjectsName';
import getObjectFields from '@salesforce/apex/soqlBuilderLWCController.getObjectFields';
import getRecords from '@salesforce/apex/soqlBuilderLWCController.getRecords';
import {ShowToastEvent} from 'lightning/platformShowToastEvent'

export default class SoqlBuilderLwc extends LightningElement {

    @track loaded = false;
    logicalOperators = [
        {label: 'AND', value: 'AND'},
        {label: 'OR', value: 'OR'}
    ];
    comparisonOperators = ['=', '!=', '<', '>', '<=', '>=', 'LIKE'];

    @track data;
    @track columns;
    @track rowOffset = 0;

    allData = [];
    @track currentPageNumber = 1;
    @track pageSize;
    @track totalPages = 0;
    @track pageList;

    @track objects;
    @track selectedObjectName;

    @track objectFields;
    selectedObjectFields = [];
    fieldsNameAndType;

    selectedLogicalOperator = 'AND';
    @track selectedObjectField;
    @track selectedComparisonOperator;
    @track compareValue;
    @track conditions = [];
    @track isSelectedFieldsExist;

    soqlStringWithoutConditions;
    @track conditionsString;
    @track soqlString;

    @track fieldNameToSort;
    @track sortDirection;

    connectedCallback() {
        this.loaded = true;
        this.conditions.push({index: 0, logicalOperator: 'AND'});
        getObjectsName()
            .then(data => {
                console.log('SUCCESS get objects name');
                console.log(data);

                this.objects = data;
                this.loaded = false;
                this.soqlString = 'SELECT ... FROM ...';
            })
            .catch(error => {
                console.log('ERROR');
                this.loaded = false;
            });
    }

    selectionChangeHandler(event) {
        this.selectedObjectName = event.target.value;
        if (this.selectedObjectName !== 'Select Object') {
            this.loaded = true;
            console.log(this.selectedObjectName);

            getObjectFields({objectName: this.selectedObjectName})
                .then(data => {
                    console.log('SUCCESS get object fields');
                    let options = [];
                    console.log(JSON.parse(data));
                    JSON.parse(data).forEach(item => {
                        options.push({
                            label: item.fieldName,
                            value: item.fieldName
                        });
                    });

                    this.fieldsNameAndType = JSON.parse(data);
                    this.objectFields = options;
                    this.loaded = false;
                    this.addObjectNameToSoqlString();
                })
                .catch(error => {
                    console.log('ERROR');
                    this.loaded = false;
                })
        }
    }

    addObjectNameToSoqlString() {
        this.soqlStringWithoutConditions =
            `SELECT ${this.selectedObjectFields ? this.selectedObjectFields.join(', ') : '...'} FROM ${this.selectedObjectName}`;
        this.makeSoqlRequestStringWithConditions();
    }

    addSelectedFields(event) {
        this.selectedObjectFields = event.detail.value;
        console.log(this.selectedObjectFields);
        this.isSelectedFieldsExist = !!this.selectedObjectFields.length;
        this.makeSoqlRequestString();
    }

    getData() {
        this.loaded = true;

        getRecords({soqlString: this.soqlString})
            .then(data => {

                let options = [];
                let numberTypes = ['DOUBLE', 'DECIMAL', 'INTEGER', 'CURRENCY'];
                let fieldsNameToType = new Map();

                this.fieldsNameAndType.forEach(item => {
                    if (this.selectedObjectFields.includes(item.fieldName)) {
                        fieldsNameToType.set(item.fieldName, item.fieldType);
                    }
                });

                this.selectedObjectFields.forEach(item => {
                    options.push({
                        label: item,
                        fieldName: item,
                        type: numberTypes.includes(fieldsNameToType.get(item)) ? 'number' : 'text',
                        sortable: 'true'
                    });
                });

                this.columns = options;

                this.totalPages = Math.ceil(data.length / (this.pageSize + 1));
                this.allData = data;
                this.currentPageNumber = 1;
                this.buildData();

                this.loaded = false;

                let title;
                let message;
                let variant;

                if (this.allData.length !== 0) {
                    title = 'Success!';
                    message = 'Data was successfully received';
                    variant = 'success';
                } else {
                    title = 'Warning!';
                    message = 'Data was successfully received, but it\'s empty';
                    variant = 'warning';
                }

                const toastEvent = new ShowToastEvent({
                    title: title,
                    message: message,
                    variant: variant
                });
                this.dispatchEvent(toastEvent);
            })
            .catch(error => {
                console.log('ERROR');
                this.loaded = false;

                const toastEvent = new ShowToastEvent({
                    title: 'Error!',
                    message: 'Data was not received',
                    variant: 'error'
                });
                this.dispatchEvent(toastEvent);
            })
    }

    buildData() {
        let data = [];
        let pageNumber = this.currentPageNumber;
        let pageSize = this.pageSize;
        let allData = this.allData;
        let i = ((pageNumber - 1) * pageSize) + pageNumber - 1;
        let j = (pageNumber * pageSize) + pageNumber - 1;

        for (; i <= j; i++) {
            if (allData[i]) {
                data.push(allData[i]);
            }
        }

        this.data = data;

        this.generatePageList(pageNumber);
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

    makeSoqlRequestString() {
        let object = this.selectedObjectName.length ? this.selectedObjectName : '...';
        let fields = this.selectedObjectFields.length ? this.selectedObjectFields.join(', ') : '...';

        this.soqlStringWithoutConditions = `SELECT ${fields} FROM ${object}`;

        if (this.conditions.length) {
            this.makeSoqlRequestStringWithConditions();
        }
    }

    changeFieldConditionsHandle(event) {
        if (event.target.value !== 'Select') {
            this.selectedObjectField = event.target.value;
            this.conditions[event.target.name].field = event.target.value;
            this.makeSoqlRequestStringWithConditions();
        }
    }

    changeComparisonOperatorHandle(event) {
        if (event.target.value !== 'Select') {
            this.selectedComparisonOperator = event.target.value;
            this.conditions[event.target.name].operator = event.target.value;
            this.makeSoqlRequestStringWithConditions();
        }
    }

    changeCompareValueHandle(event) {
        this.compareValue = event.target.value;
        this.conditions[event.target.name].value = event.target.value;
        this.makeSoqlRequestStringWithConditions();
    }

    changeLogicalOperatorHandle(event) {
        this.selectedLogicalOperator = event.target.value;
        this.conditions[event.target.name].logicalOperator = event.target.value;
        this.makeSoqlRequestStringWithConditions();
    }

    checkValidCondition(item) {
        return item !== undefined && item !== 'Select';
    }

    makeSoqlRequestStringWithConditions() {

        const setConditions = (item, index) => {
            let isFieldValid = this.checkValidCondition(this.conditions[index].field);
            let isOperatorValid = this.checkValidCondition(this.conditions[index].operator);
            let isValueValid = this.conditions[index].value !== undefined;

            if (isFieldValid && isOperatorValid && isValueValid) {
                let inputValue;
                let typeOfSelectedField = this.fieldsNameAndType.find(mapItem => mapItem.fieldName === item.field).fieldType;
                inputValue = item.operator === 'LIKE' ? `%${item.value}%` : item.value;

                inputValue = ['STRING', 'ID', 'PHONE', 'URL', 'DATE', 'TIME'].includes(typeOfSelectedField)
                    ? `'${inputValue}'`
                    : inputValue;

                let conditionString = `${item.field} ${item.operator} ${inputValue}`;
                return index === 0 ? `${conditionString}` : `${item.logicalOperator} ${conditionString}`;
            }
        };

        let conditionsString = this.conditions.map(setConditions).join(' ');
        this.conditionsString = conditionsString;

        this.soqlString = conditionsString.length
            ? `${this.soqlStringWithoutConditions} WHERE ${conditionsString}`
            : this.soqlStringWithoutConditions;
    }

    deleteCondition(event) {

        if (this.conditions.length > 1) {
            this.conditions.splice(event.target.id.substring(0, 1), 1);
        }

        this.makeSoqlRequestStringWithConditions();
    }

    addCondition() {
        this.conditions.push({index: this.conditions.length, logicalOperator: 'AND'});
    }

    changeConditionsString(event) {
        this.conditionsString = event.target.value;
        this.soqlString = this.soqlStringWithoutConditions + ' WHERE ' + this.conditionsString;
    }

    updateColumnSorting(event) {
        let fieldName = event.detail.fieldName;
        let sortDirection = event.detail.sortDirection;

        this.fieldNameToSort = fieldName;
        this.sortDirection = sortDirection;

        this.sortData(fieldName, sortDirection);
        this.buildData();
    }

    sortData(fieldName, sortDirection) {
        let sortResult = Object.assign([], this.allData);

        this.allData = sortResult.sort((a, b) => {

            if (a[fieldName] === undefined) {
                return 1;
            } else if (b[fieldName] === undefined) {
                return -1;
            } else if (a[fieldName] < b[fieldName]) {
                return sortDirection === 'asc' ? -1 : 1;
            } else if (a[fieldName] > b[fieldName]) {
                return sortDirection === 'asc' ? 1 : -1;
            } else {
                return 0;
            }
        })
    }

    onNext() {
        this.currentPageNumber += 1;
        this.rowOffset += 10;
        this.buildData();
    }

    onPrev() {
        this.currentPageNumber -= 1;
        this.rowOffset -= 10;
        this.buildData();
    }

    processMe(event) {
        this.currentPageNumber = parseInt(event.target.name);
        this.buildData();
    }

    onFirst() {
        this.currentPageNumber = 1;
        this.buildData();
        this.rowOffset = 0;
    }

    onLast() {
        this.currentPageNumber = this.totalPages;
        this.buildData();
        this.rowOffset = (this.totalPages - 1) * 10
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

    get isAllDataExist() {
        return this.allData.length;
    }

    get isConditionRight() {
        return !(this.selectedObjectField !== 'Select' && this.selectedLogicalOperator !== 'Select' && this.compareValue);
    }

    get logicalOperatorsLabel() {
        return this.conditions.length === 0 ? 'AND/OR' : '';
    }

    get fieldsLabel() {
        return this.conditions.length === 0 ? 'Select Field' : '';
    }

    get compareOperatorsLabel() {
        return this.conditions.length === 0 ? 'Select Compare Operator' : '';
    }

    get compareValueLabel() {
        return this.conditions.length === 0 ? 'Select Compare Operator' : '';
    }

    get isConditionsLengthMoreThenTwo() {
        return this.conditions.length > 2
    }
}