/**
 * Created by Artem Koverchik on 2/25/2020.
 */

import {LightningElement, track, wire} from 'lwc';
import { subscribe, unsubscribe, onError, setDebugFlag, isEmpEnabled } from 'lightning/empApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent'
import getCases from '@salesforce/apex/ObjectManagerController.getCases'
import getCreatedData from '@salesforce/apex/ObjectManagerController.getCreatedData'
import deleteCase from '@salesforce/apex/ObjectManagerController.deleteCase'
import getSObjectFields from '@salesforce/apex/ObjectManagerController.getSObjectFields'
import getCoincidences from '@salesforce/apex/ObjectManagerController.getCoincidences'
import publishObjectManagerEvent from '@salesforce/apex/ObjectManagerController.publishObjectManagerEvent'
import { createRecord, deleteRecord } from 'lightning/uiRecordApi';

let caseId;
let selectedCase = {};

export default class ObjectManager extends LightningElement {

    channelName = '/event/Case_Event__e';
    subscription;

    @track cards = [];
    @track cardClass = '';
    @track loaded = true;
    @track objects = [];
    @track mappingFields = [];
    @track currentObject = '';
    @track createdData = [];
    countOfFields = 0;

    connectedCallback() {
        const callbackFunction = response =>  {
            console.log('Platform event was received');
            console.log(response.data.payload.ArtemK__Data__c);
            let toDisable = response.data.payload.ArtemK__ToDisableCard__c ? response.data.payload.ArtemK__ToDisableCard__c : null;
            let toDelete = response.data.payload.ArtemK__ToDeleteCard__c ? response.data.payload.ArtemK__ToDeleteCard__c : null;
            let currentCaseId = response.data.payload.ArtemK__CaseId__c ? response.data.payload.ArtemK__CaseId__c : null;

            if (toDelete || toDisable) {
                if (toDisable) {
                    this.cards.find(item => item.caseId === currentCaseId).notDisabled = false;
                    this.disableCard(currentCaseId);
                } else if (toDelete) {
                    this.template.querySelectorAll('.disabledCard').forEach(item => {
                        if (item.title === currentCaseId) {
                            item.classList.remove('disabledCard');
                        }
                    });
                    this.cards = this.cards.filter(item => item.caseId !== currentCaseId);
                }
            } else if (response.data.payload.ArtemK__Data__c) {
                this.addNewCard(response.data.payload.ArtemK__Data__c, currentCaseId, false);
            } else if (!toDisable) {
                this.cards.find(item => item.caseId === currentCaseId).notDisabled = true;
                this.template.querySelectorAll('.disabledCard').forEach(item => {
                    if (item.title === currentCaseId) {
                        item.classList.remove('disabledCard');
                    }
                });
            }

            dispatchEvent(
                new ShowToastEvent({
                    title: 'Platform Event',
                    message: 'Platform event was received',
                    variant: 'success'
                })
            );
        };

        subscribe(this.channelName, -1, callbackFunction).then(response => {
            console.log('Successfully subscribed to : ', JSON.stringify(response.channel));
            this.subscription = response;
            console.log(response);
        });

        getCases()
            .then((data) => {
                console.log(data);
                data.forEach(item => {
                    this.addNewCard(item.Description, item.Id, item.ArtemK__IsDisabled__c);
                })
            })
            .catch(error => {
                console.log(error);
            });

        getCreatedData()
            .then(data => {

                console.log('--------------------------');
                console.log(data);
                console.log('--------------------------');

                this.createdData = [];

                data.forEach(item => {
                    let option = {};

                    option.apiName = item.Description.substring(0, item.Description.indexOf(','));
                    option.id = item.Description.substring(item.Description.indexOf(',') + 1);

                    this.createdData.push(option);
                })
            })
            .catch(error => {
                console.log(error);
            });

        window.addEventListener('beforeunload', this.beforeUnloadHandler.bind(this));
    }

    disconnectedCallback() {
        window.removeEventListener("beforeunload", this.beforeUnloadHandler);
        unsubscribe(this.subscription, response => {
            console.log('unsubscribe() response: ', JSON.stringify(response));
        });
        console.log("disconnectedCallback executed");
    }

    beforeUnloadHandler(event) {
        console.log('before unload handler has been called.');

        if (selectedCase) {
            publishObjectManagerEvent({eventType: 'enable', caseId: selectedCase.caseId})
                .then(() => {
                    console.log('SUCCESS');
                })
                .catch(error => {
                    console.log(error);
                })
        }
    }

    disableCard(caseId) {
        console.log('DISABLE CARD');
        console.log(caseId);
        console.log(this.template.querySelectorAll('.card'));
        this.template.querySelectorAll('.card').forEach(item => {
            if (item.title === caseId) {
                item.classList.add('disabledCard');
            }
        });
    }

    enableCard(caseId) {
        publishObjectManagerEvent({eventType: 'enable', caseId: caseId})
            .then(() => {
                console.log('SUCCESS ENABLE');
            })
            .catch(error => {
                console.log(error);
            })
    }

    addNewCard(data, caseId, isDisabled) {
        let parsedData = JSON.parse(data);
        let options = [];

        for (let item in parsedData) {
            options.push(`${item} : ${parsedData[item]}`)
        }

        if (isDisabled) {
            parsedData.class = 'slds-box slds-m-bottom_small card disabledCard';
        } else {
            parsedData.class = 'slds-box slds-m-bottom_small card';
        }

        parsedData.stringValue = options;
        parsedData.caseId = caseId;
        parsedData.notDisabled = !isDisabled;

        this.cards.push(parsedData);
    }

    deleteCard(event) {
        console.log(event.target.title);
        let currentCard = this.cards[event.target.title];

        if (currentCard.notDisabled || currentCard.caseId === selectedCase.caseId) {
            publishObjectManagerEvent({eventType: 'delete', caseId: currentCard.caseId})
                .then(() => {
                    console.log('SUCCESS');
                    if (currentCard.caseId === selectedCase.caseId) {
                        this.mappingFields = [];
                        this.objects = [];
                    }
                })
                .catch(error => {
                    console.log(error);
                })
        }
    }

    handleDragStart(event) {
        event.dataTransfer.dropEffect = 'move';

        caseId = event.target.title;
        console.log('event.target.dataset.item=' + event.target.title);
    }

    handleDragOver(event){
        event.dataTransfer.dropEffect = 'move';
        event.preventDefault();
    }

    handleDrop(){
        console.log('inside handle drop');
        this.loaded = false;

        if (selectedCase) {
            this.enableCard(selectedCase.caseId);
            this.mappingFields = [];
        }

        selectedCase = this.cards.find(item => caseId === item.caseId);
        console.log(selectedCase);
        //this.disableCard(selectedCase.caseId);

        let fields = [];

        for (let item in selectedCase) {
            if (!(item === 'stringValue' || item === 'caseId' || item === 'class' || item === 'notDisabled')) {
                fields.push(item.toLowerCase());
            }
        }

        this.countOfFields = fields.length;
        console.log(fields);

        publishObjectManagerEvent({eventType: 'disable', caseId: selectedCase.caseId})
            .then(() => {
                console.log('SUCCESS DISABLE');

            })
            .catch(error => {
                console.log(error);
            });

        getCoincidences({data: JSON.stringify(fields)})
            .then(data => {
                console.log(data);
                this.loaded = true;

                this.parseCoincidences(data);
            })
            .catch(error => {
                console.log(error);
                this.loaded = true;
            });

    }

    parseCoincidences(data) {
        let options = [];

        for (let item in data) {
            options.push({
                label: item,
                value: `${Math.trunc(data[item] / this.countOfFields * 100)}%`
            })
        }

        this.objects = options;
    }

    handleObjectClick(event) {
        console.log(this.objects[event.target.value]);
        this.loaded = false;
        this.currentObject = this.objects[event.target.value].label;

        getSObjectFields({objectName: this.currentObject})
            .then(data => {
                console.log(data);

                let options = [];

                for (let item in data) {
                    let option = {};
                    let type = data[item];
                    let value = selectedCase[item] ? selectedCase[item] : selectedCase[item.toLowerCase()];

                    option.label = item;

                    if (value) {
                        option.stringValue = value;
                        this.handleValues(option, value, type)
                    } else {
                        option.type = 'text';
                    }

                    options.push(option);
                }

                this.mappingFields = options;
                console.log(options);
                this.loaded = true;
            })
            .catch(error => {
                console.log(error);
                this.loaded = true;
            })
    }

    handleValues(option, value, type) {

        if (type === 'BOOLEAN') {
            option.value = value === 'true';
            option.type = 'checkbox';
        } else if (type === 'DOUBLE' || type === 'DECIMAL' || type === 'CURRENCY') {
            option.value = +value;
            option.type = 'number';
        } else if (type === 'DATE') {
            option.value = (new Date(Date.parse(value))).toISOString();
            option.type = 'date';
        } else if (type === 'DATETIME') {
            option.value = (new Date(Date.parse(value)));
            option.type = 'datetime';
        } else {
            option.value = value;
            option.type = 'text';
        }

        console.log(option);
    }

    handleChangeInput(event) {
        let currentField = this.mappingFields.find(item => item.label === event.target.label);
        let type = event.target.type;

        if (type === 'checkbox') {
            currentField.value = event.target.checked;
            currentField.stringValue = event.target.checked + '';
        } else if (type === 'number') {
            currentField.value = +event.target.value;
        } else if (type === 'datetime') {
            currentField.value = (new Date(Date.parse(event.target.value))).toISOString();
        } else if (type === 'date') {
            currentField.value = (new Date(Date.parse(event.target.value))).toISOString();
        } else {
            currentField.value = event.target.value;
        }

        console.log(currentField);
    }

    saveRecord() {
        this.loaded = false;
        let fields = {};

        this.mappingFields.forEach(item => {
            if (item.value) {
                fields[item.label] = item.value;
            }
        });

        const recordInput = {apiName: this.currentObject, fields};

        createRecord(recordInput)
            .then(data => {
                console.log(data);

                this.createdData.push({
                    apiName: data.apiName,
                    id: data.id
                });

                recordInput.apiName = 'Case';

                let fields = {
                    Subject: 'CreatedData',
                    Description: `${data.apiName}, ${data.id}`
                };

                createRecord({apiName: 'Case', fields})
                    .then(data => {
                        console.log('success');
                    })
                    .catch(error => {
                        console.log(error);
                    });

                publishObjectManagerEvent({eventType: 'delete', caseId: selectedCase.caseId})
                    .then(() => {
                        console.log('success');
                        this.loaded = true;
                        this.objects = [];
                        this.mappingFields = [];
                        selectedCase = {};
                    })
                    .catch(error => {
                        console.log(error);
                        this.loaded = true;
                    })
            })
            .catch(error => {
                console.log(error);
                this.loaded = true;
            });
        console.log(fields);
    }

    get isCards() {
        return this.cards.length > 0;
    }

    get isMappingFields() {
        return this.mappingFields.length > 0;
    }

    get isSelectedCase() {
        return selectedCase.caseId;
    }

    get createdDataLength() {
        return this.createdData.length;
    }
}