import EventDispatcher from "./EventDispatcher";
import Events from "./Events";

export default class FileParser {
    static assetsMap: {
        [key: string]: { image: File, atlas: File }
    } = {}
    static parseFile(files: File[] | FileList) {
        let fileCnt = 0;
        console.log(files);
        for (let i = 0; i < files.length; i++) {
            fileCnt++;
            let file: File = files[i];
            let name = file.name;
            let nameArr = name.split(".");
            nameArr.pop();
            let fileName = nameArr.join(".");
            if (typeof this.assetsMap[fileName] == "undefined") {
                this.assetsMap[fileName] = Object.create({});
            }
            let ext = Laya.Loader.getTypeFromUrl(name);
            if (ext == Laya.Loader.ATLAS || ext == Laya.Loader.JSON) {
                this.assetsMap[fileName]['atlas'] = file;
            } else if (ext == Laya.Loader.IMAGE) {
                this.assetsMap[fileName]['image'] = file;
            } else {
                alert("发现无效的动画图集或描述文件，请检查文件是否有误！");
            }
        }
        if (fileCnt == 0 && fileCnt % 2 !== 0) {
            alert("未发现有效的资源文件或者缺少成对的资源文件！");
        } else {
            EventDispatcher.event(Events.UPLOAD_SUCCESS, this.assetsMap);
        }
    }

    static handleFile(key: string) {
        let assets = this.assetsMap[key];
        let image = assets['image'];
        let atlas = assets['atlas'];
        let blob = new Blob([image], { type: image.type });
        let imageUrl = URL.createObjectURL(blob);
        Laya.loader.load([
            { url:imageUrl, type: Laya.Loader.IMAGE },
        ], Laya.Handler.create(this, () => {
            Laya.Loader.loadedMap[`blob:${location.origin}/${image.name}`] = Laya.Loader.textureMap[imageUrl];
            let reader = new FileReader();
            reader.readAsText(atlas);
            reader.onload = (e) => {
                let json = JSON.parse(<string>e.target.result);
                json.meta.image = imageUrl.replace(`blob:${location.origin}/`, "");
                let blob = new Blob([JSON.stringify(json)], { type: atlas.type });
                let atlasUrl = URL.createObjectURL(blob);
                Laya.loader.load([
                    { url:atlasUrl, type: Laya.Loader.ATLAS }
                ], Laya.Handler.create(this, () => {
                    EventDispatcher.event(Events.SHOW_VIEW, atlasUrl);
                    URL.revokeObjectURL(atlasUrl);
                    URL.revokeObjectURL(imageUrl);
                }))
            }
        }))
    }
}