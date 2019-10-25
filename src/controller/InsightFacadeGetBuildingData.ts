export default class InsightFacadeGetBuildingData {
    public getBuildingData(indexHtm: any) {
        let table = null;
        for (let e of indexHtm.childNodes) {
            if (e.nodeName === "html") {
                for (let e1 of e.childNodes) {
                    if (e1.nodeName === "body") {
                        table = this.getTableFromBody(e1);
                    }
                }
            }
        }

        let buildings = [];
        if (table != null) {
            for (let e of table.childNodes) {
                if (e.nodeName === "tbody") {
                    buildings = this.extractBuildingsData(e);
                }
            }
        }
    }

    private extractBuildingsData(tbody: any): any[] {
        let buildingsData: any[] = [];
        for (let e of tbody.childNodes) {
            if (e.nodeName === "tr") {
                let buildingData = this.extractBuildingData(e);
                buildingsData.push(buildingData);
            }
        }
        // eslint-disable-next-line no-console
        console.log(buildingsData);
        return buildingsData;
    }

    private extractBuildingData(tr: any): object {
        let buildingData: {name: string, address: string, link: string} = {name: null, address: null, link: null};
        for (let e of tr.childNodes) {
            if (e.nodeName === "td") {
                if (this.hasAttrField(e.attrs, "class",
                    "views-field views-field-field-building-code")) {
                    buildingData.name = this.extractBuildingCode(e);
                }
                // for (let e1 of e.childNodes) {
                //     if (e1.nodeName === "a") {
                //         buildingData.link = this.getAttrField(e.attrs, "href");
                //         break;
                //     }
                // }
            }
        }
        return buildingData;
    }

    private extractBuildingCode(td: any): string {
        for (let e of td.childNodes) {
            if (e.nodeName === "#text") {
                let rawBuildingCode = e.value;
                return rawBuildingCode.trim();
            }
        }
        return null;
    }

    private getTableFromBody(body: any) {
        for (let e of body.childNodes) {
            if (e.nodeName === "div" && e.attrs[0] &&
                e.attrs[0].value === "full-width-container") {
                for (let e1 of e.childNodes) {
                    if (e1.nodeName === "div" && this.hasAttrField(e1.attrs, "id", "main")) {
                        return this.getTableFromMainDiv(e1);
                    }
                }
            }
        }
    }

    private getTableFromMainDiv(maindiv: any) {
        for (let e of maindiv.childNodes) {
            if (e.nodeName === "div" && this.hasAttrField(e.attrs, "id", "content")) {
                for (let e1 of e.childNodes) {
                    if (e1.nodeName === "section") {
                        return this.getTableFromSection(e1);
                    }
                }
            }
        }
    }

    private getTableFromSection(section: any) {
        for (let e of section.childNodes) {
            if (e.nodeName === "div" && this.hasAttrField(e.attrs, "class",
                "view view-buildings-and-classrooms " +
                "view-id-buildings_and_classrooms " +
                "view-display-id-page container " +
                "view-dom-id-9211a3b29ecac7eefe0218f60b62b795")) {
                for (let e1 of e.childNodes) {
                    if (e1.nodeName === "div" && this.hasAttrField(e1.attrs, "class", "view-content")) {
                        return this.getTableFromViewContentDiv(e1);
                    }
                }
            }
        }
    }

    private getTableFromViewContentDiv(div: any) {
        for (let e of div.childNodes) {
            if (e.nodeName === "table" && this.hasAttrField(e.attrs, "class", "views-table cols-5 table")) {
                return e;
            }
        }
    }

    private getAttrField(attrs: Array<{ name: string, value: string }>, attrField: string): string {
        for (let attr of attrs) {
            if (attr.name === attrField) {
                return attr.value;
            }
        }
        return null;
    }

    private hasAttrField(attrs: Array<{ name: string, value: string }>, attrField: string, attrValue: string) {
        for (let attr of attrs) {
            if (attr.name === attrField && attr.value === attrValue) {
                return true;
            }
        }
    }
}
