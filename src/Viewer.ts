import EventDispatcher from "./EventDispatcher";
import Events from "./Events";
import FileParser from "./FileParser";
import GViewerPanel from "./GViewerPanel";
const options = {
    fps: 12,
    idx: 0
}
export default class Viewer {
    constructor() {
        this.initView();
        this.bindEvent();
    }

    viewer: GViewerPanel;
    animation: Laya.Animation;
    gui: dat.GUI;
    filesFloder: dat.GUI;
    initView() {
        this.viewer = fgui.UIPackage.createObject("Viewer", "Main") as GViewerPanel;
        fgui.GRoot.inst.addChild(this.viewer);
        fgui.GRoot.inst.setSize(Laya.stage.width, Laya.stage.height);
        Laya.stage.addChild(fgui.GRoot.inst.displayObject);
        this.animation = Laya.Pool.getItemByClass("Animation", Laya.Animation)
        this.viewer.displayObject.addChild(this.animation);
        this.viewer.setSize(Laya.stage.width, Laya.stage.height);
        this.initInspector();
    }

    initInspector() {
        this.gui = new window['dat'].GUI({ name: "Inspector" });
        let FPS = [12, 24, 30, 48, 60];
        this.gui.add(options, "fps", FPS).name("帧频").onChange((val) => {
            options.fps = val;
            this.animation.interval = 1000 / val
        });
        this.filesFloder = this.gui.addFolder("Files");
    }

    bindEvent() {
        EventDispatcher.on(Events.SHOW_VIEW, this, this.showAnimation);
        EventDispatcher.on(Events.UPLOAD_SUCCESS, this, this.onLoaded);
    }

    onLoaded(data) {
        this.viewer.onShowAnimations();
        if (this.filesFloder) {
            this.gui.removeFolder(this.filesFloder);
        }
        this.filesFloder = this.gui.addFolder("Files");
        this.filesFloder.add(options, "idx", Object.keys(data)).name("文件列表").onChange((val) => {
            FileParser.handleFile(val);
        });
        FileParser.handleFile(Object.keys(data)[0]);
        this.filesFloder.open();
    }

    showAnimation(atlas: string) {
        this.animation.loadAtlas(atlas, Laya.Handler.create(this, this.onAtlasLoaded));
    }

    onAtlasLoaded() {
        this.animation.interval = 1000 /options.fps;			// 设置播放间隔（单位：毫秒）
        this.animation.play();

        // 获取动画的边界信息
        let bounds = this.animation.getGraphicBounds();
        this.animation.pivot(bounds.width / 2, bounds.height / 2);
        this.animation.pos(Laya.stage.width / 2, Laya.stage.height / 2);
    }
}