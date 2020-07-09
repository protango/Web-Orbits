import htmlToElement from "../../utilities/htmlToElement";
import InfoWindow from "./infoWindow";

export default class ObjectBrowserWindow extends InfoWindow {
    private static _instance: ObjectBrowserWindow
    public static get instance() : ObjectBrowserWindow {
        return this._instance ?? (this._instance = new ObjectBrowserWindow());
    }

    private constructor() {
        let content = htmlToElement(
            `<div class="objectBrowser">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Mass</th>
                            <th>Diameter</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>ID</td>
                            <td>Name</td>
                            <td>Mass</td>
                            <td>Diameter</td>
                        </tr>
                    </tbody>
                </table>
            </div>`
        ) as HTMLDivElement;
        super("Object Browser", content);

        
    }
}