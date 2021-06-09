/**
 * Created by Artem Koverchik on 2/17/2020.
 */

import {LightningElement, track, api} from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent'
import getCategories from '@salesforce/apex/CaseCategoriesController.getCaseCategories'
import setCategories from '@salesforce/apex/CaseCategoriesController.setCaseCategories'
import deleteCategory from '@salesforce/apex/CaseCategoriesController.deleteCaseCategory'
import getDependentPickList from '@salesforce/apex/CaseCategoriesController.getDependentOptions'

export default class CaseCategories extends LightningElement {

    @api recordId;

    @track categories = [];

    @track selectedCategory;
    @track subcategoriesToView = [
        {
            label: 'New',
            subcategories: []

        },
        {
            label: 'Working',
            subcategories: []
        },
        {
            label: 'Escalated',
            subcategories: []
        }
    ];

    @track dropdown = false;

    connectedCallback() {

        getDependentPickList()
            .then(data => {
                for (let category in data) {
                    console.log(category);
                    let subcategories = [];

                    data[category].forEach(subcategory => {
                        subcategories.push({label: subcategory, checked: false})
                    });

                    this.categories.push({
                        label: category,
                        subcategories: subcategories
                    })
                }

                console.log('--------------');
                console.log(this.categories);
                console.log('--------------');

                this.setData();
            })
            .catch(error => {
                console.log(error);
            });
    }

    setData() {
        getCategories({caseId: this.recordId})
            .then(data => {
                console.log(data);
                this.categories.forEach(category => {
                    category.subcategories.forEach(subcategory => {
                        if (data.includes(subcategory.label)) {
                            subcategory.checked = true;
                        }
                    })
                })
            })
            .catch(error => {
                console.log(error);
            });
    }

    changeCategoryHandle(event) {
        this.selectedCategory = event.detail.value;

    }

    changeSubcategoryHandle(event) {
        this.categories
            .find(item => item.label === this.selectedCategory).subcategories
            .find(item => item.label === event.target.label).checked = event.target.checked;
    }

    saveCategories() {
        let categories = [];

        this.categoriesValues.forEach(item => {
            categories.push(item.label);
        });

        setCategories({caseCategoriesStrings: categories, caseId: this.recordId})
            .then(() => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Categories successfully saved!',
                        variant: 'success'
                    })
                )
            })
            .catch(error => {
                console.log(error);
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: 'Something went wrong',
                        variant: 'error'
                    })
                )
            })
    }

    deleteCategories(event) {
        console.log(event.target.title);
        let subcategory = event.target.title;

        deleteCategory({name: subcategory})
            .then(() => {
                this.categories.forEach(category => {
                    let currentSubcategory = category.subcategories.find(item => item.label === subcategory);

                    if (currentSubcategory !== undefined) {
                        currentSubcategory.checked = false;
                    }
                });

                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Category successfully deleted!',
                        variant: 'success'
                    })
                )
            })
            .catch(error => {
                console.log(error);
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: 'Something went wrong',
                        variant: 'error'
                    })
                )
            })
    }

    get categoryOptions() {
        let options = [];

        this.categories.forEach(item => {
            options.push({
                label: item.label, value: item.label
            })
        });

        return options;
    }

    get subcategoriesOptions() {
        let options = [];

        this.categories.find(item => item.label === this.selectedCategory).subcategories.forEach(item => {
            options.push({
                label: item.label, checked: item.checked
            })
        });

        return options;
    }

    get values() {
        return this.subcategoriesToView.find(item => item.label === this.selectedCategory).subcategories;
    }

    get isCategorySelected() {
        return this.selectedCategory;
    }

    get categoriesValues() {
        return this.categories.map(item => item.subcategories.filter(item => item.checked)).flat();
    }
}