import FileParser from "./FileParser";
import Viewer from "./Viewer";

export default class App{
    public fileInput: HTMLInputElement;
    constructor(){
        this.init();
    }

    init(){
        this.loadResource();
        this.initDropEvent();
    }

    loadResource(){
		fgui.UIPackage.loadPackage("res/ui/Viewer", Laya.Handler.create(this, this.onResLoaded))
    }

	onResLoaded(){
		new Viewer();
	}

    initDropEvent() {
        let canvas = document.querySelector("#layaCanvas");
        canvas.addEventListener("drop", (e: DragEvent) => {
            e.preventDefault();
            let dataTransfer = e.dataTransfer;
            if (dataTransfer.items !== undefined) {
                let dataTransferItemList = dataTransfer.items;
                let files: File[] = [];
                for (let i = 0; i < dataTransferItemList.length; i++) {
                    let item = dataTransferItemList[i];
                    if (item.kind === "file" && item.webkitGetAsEntry().isFile) {
                        let file = item.getAsFile();
                        files.push(file);
                    }
                }
                FileParser.parseFile(files);
            }
        });

        canvas.addEventListener("dragover", (e) => {
            e.preventDefault();
        });
    }

    public createFileInput() {
        this.fileInput = document.createElement("input");
        this.fileInput.type = "file";
        this.fileInput.style.display = "none";
        this.fileInput.multiple = true;
        this.fileInput.addEventListener('change', () => {
            if (!this.fileInput.value) {
                return;
            }
            let files = this.fileInput.files;
            FileParser.parseFile(files);
            this.fileInput.value = "";
        });
        // EventManager.on(Events.EMIT_UPLOAD, this.emitUploadFile, this);
    }
}