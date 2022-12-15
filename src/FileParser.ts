import EventDispatcher from "./EventDispatcher";
import Events from "./Events";

export default class FileParser {
    static parseFile(files: File[] | FileList) {
        let atlas, image;
        let imageName = "", hasImport = false;
        let urls = [];
        for (let i = 0; i < files.length; i++) {
            let file: File = files[i];
            let name = file.name;
            let type = file.type;
            let ext = Laya.Loader.getTypeFromUrl(name);
            if (ext == Laya.Loader.ATLAS || ext == Laya.Loader.JSON) {
                atlas = file;
            } else if (ext == Laya.Loader.IMAGE) {
                let blob = new Blob([file], { type });
                let url = URL.createObjectURL(blob);
                urls.push(url);
                image = url;
                imageName = name;
            }
        }
        if (urls.length == 0 && !hasImport) {
            alert("未发现有效的资源文件！");
        } else {
            if (!atlas || !image) {
                alert("未发现有效的动画图集或描述文件！");
            } else {
                Laya.loader.load([
                    { url: image, type: Laya.Loader.IMAGE },
                ], Laya.Handler.create(this, () => {
                    Laya.Loader.loadedMap[`blob:file:///${imageName}`] = Laya.Loader.textureMap[image];
                    let reader = new FileReader();
                    reader.readAsText(atlas);
                    reader.onload = (e) => {
                        let json = JSON.parse(<string>e.target.result);
                        json.meta.image = image.replace("blob:file:///","");
                        let blob = new Blob([JSON.stringify(json)], { type: atlas.type });
                        let url = URL.createObjectURL(blob);
                        Laya.loader.load([
                            { url, type: Laya.Loader.ATLAS }
                        ], Laya.Handler.create(this, () => {
                            EventDispatcher.event(Events.UPLOAD_SUCCESS, url);
                            URL.revokeObjectURL(url);
                            urls.forEach((url) => {
                                URL.revokeObjectURL(url);
                            })
                        }))
                    }
                }))
            }
        }
    }
}