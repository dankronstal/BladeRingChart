module powerbi.extensibility.visual.PBI_CV_820a1803_8e00_4869_b083_b47eeec8aff2  {
    /**
     * Gets property value for a particular object.
     *
     * @function
     * @param {DataViewObjects} objects - Map of defined objects.
     * @param {string} objectName       - Name of desired object.
     * @param {string} propertyName     - Name of desired property.
     * @param {T} defaultValue          - Default value of desired property.
     */
    export function getValue<T>(objects: DataViewObjects, objectName: string, propertyName: string, defaultValue: T ): T {
        if(objects) {
            let object = objects[objectName];
            if(object) {
                let property: T = object[propertyName];
                if(property !== undefined) {
                    return property;
                }
            }
        }
        return defaultValue;
    }

    /**
     * Gets property value for a particular object in a category.
     *
     * @function
     * @param {DataViewCategoryColumn} category - List of category objects.
     * @param {number} index                    - Index of category object.
     * @param {string} objectName               - Name of desired object.
     * @param {string} propertyName             - Name of desired property.
     * @param {T} defaultValue                  - Default value of desired property.
     */
    export function getCategoricalObjectValue<T>(category: DataViewCategoryColumn, index: number, objectName: string, propertyName: string, defaultValue: T): T {
        let categoryObjects = category.objects;

        if(categoryObjects) {
            let categoryObject: DataViewObject = categoryObjects[index];
            if(categoryObject) {
                let object = categoryObject[objectName];
                if(object) {
                    let property: T = object[propertyName];
                    if(property !== undefined) {
                        return property;
                    }
                }
            }
        }
        return defaultValue;
    }
}